from pybliometrics.scopus import AbstractRetrieval, SerialSearch
import pandas as pd
import requests
import json
import re
from tqdm import tqdm
from confluent_kafka import Producer, Consumer, KafkaError
from config import (
    KAFKA_BROKER,
    TOPIC,
    CONSUMER_GROUP
)
import datetime
import platform
from typing import Optional
from pydantic import BaseModel


api_key = '464f17417c90aff3a9e077e3952aece0'

attributes = [
        "title",
        "abstract",
        "affiliation",
        "authors",
        "authkeywords",
        "publicationName",
        "publisher",
        "subject_areas",
        "subtypedescription",
        "citedby_count",
        "references",
        "issn"
]

map_attributes = {
    'title': 'Title',
    'abstract': 'Abstract',
    'University': 'University',
    'Country': 'Country',
    'Index_authors': 'Index_authors',
    'authkeywords': 'Keywords',
    'publicationName': 'PublicationName',
    'publisher': 'Publisher',
    'Subject_Area': 'Subject_Area',
    'Subject_Area_Code': 'Subject_Area_CodeType',
    'subtypedescription': 'Citation_Type',
    'citedby_count': 'Citation_Number',
    'references_number': 'Reference_number',
    'year': 'Year',
    'ref_title': "Reference_title"
}


def get_paper_info(papers):
    all_papers = []
    count_none = 0

    key = 1
    for paper in tqdm(papers):
        data_dict = {}
        if paper["eid"]:
            ab = AbstractRetrieval(paper["eid"], view='FULL')
            for attr in attributes:
                if hasattr(ab, attr):
                    value = getattr(ab, attr)
                    if value is not None:
                        if attr == "affiliation":
                            uni_aff = []
                            country_aff = []
                            for aff in value:
                                uni_aff.append(aff.name)
                                country_aff.append(aff.country)
                            data_dict["University"] = list(set(uni_aff))
                            data_dict["Country"] = list(set(country_aff))
                        elif attr == "authors":
                            index_author = []
                            for author in value:
                                index_author.append(author.indexed_name)
                            data_dict["Index_authors"] = list(set(index_author))
                        elif attr == "subject_areas":
                            subject_area = []
                            subject_area_code = []
                            for subj in value:
                                subject_area.append(subj.area)
                                subject_area_code.append(subj.abbreviation)
                            data_dict["Subject_Area"] = list(set(subject_area))
                            data_dict["Subject_Area_Code"] = list(set(subject_area_code))
                        elif attr == "references":
                            references = ab.references
                            titles = []
                            data_dict["references_number"] = len(references)
                            for ref in references:
                                try:
                                    titles.append(ref.title)
                                except:
                                    titles.append(None)
                            data_dict["ref_title"] = titles
                        elif attr == "issn":
                            try:
                                pattern = r'\b\d{4}\b'
                                match = re.search(pattern, ab.abstract)
                                if match:
                                    year = match.group()
                                else:
                                    search = SerialSearch(query={"issn": value.split(" ")[0]})
                                    search_result = search.results[0]
                                    year = search_result.get("coverageStartYear")
                                data_dict["year"] = year
                            except:
                                print(paper)
                        else:
                            data_dict[map_attributes[attr]] = value
                    else:
                        count_none += 1
                else:
                    data_dict[attr] = ""
        all_papers.append(data_dict)
        key += 1
    return all_papers, count_none

class Item(BaseModel):
    api_key: str
    title: str | None = None
    count: int | None = None

def get_papers(item: Item):
    years = [
        "2016,2018",
        "2017,2019",
        "2019,2021",
        "2020,2022",
        "2021,2023",
        "2022,2024",
    ]

    super_all_paper = []

    base_url = "https://api.elsevier.com/content/search/scopus"
    param = f"&apiKey={item.api_key}&httpAccept=application%2Fjson"

    headers = {
        'Accept':'application/json',
        'X-ELS-APIKey': item.api_key
    }
    
    for year in years:
        query = f'query=PUBYEAR > {year.split(",")[0]} AND PUBYEAR < {year.split(",")[1]}'
        
        if item.title:
            query += f' AND TITLE({item.title})'

        if item.count:
            param += f"&count={item.count}"
        else:
            param += "&count=1"

        url = f"{base_url}?{query}{param}"
        print(url)
        response = requests.get(url, headers)

        if response.status_code == 200:
            papers_from_search = json.loads(response.text)['search-results']['entry']
            paper_nec_data, _ = get_paper_info(papers_from_search)
            super_all_paper += paper_nec_data
        else:
            print("Error code", response.status_code)
            break

    return super_all_paper
