from pyspark import SparkContext
from pyspark.sql import SparkSession
import pandas as pd
import os
import json
from config import (
    REDIS_SERVER,
    API_SERVER,
    KAFKA_BROKER,
    TOPIC,
    CONSUMER_GROUP
)
import redis
from confluent_kafka import Producer, Consumer, KafkaError
import platform
import datetime
from tqdm import tqdm

def open_file(file_path):
    with open(file_path, encoding='utf-8') as fd:
        cat = json.load(fd)
        cat = cat["abstracts-retrieval-response"]

    return cat

def extract_item(cat):
    item_ = cat["item"]

    bib = item_["bibrecord"]
    head = bib["head"]
    abstract = head.get("abstracts", None)

    publication_year = head["source"]["publicationyear"]["@first"]
    classification_group = head["enhancement"]["classificationgroup"]["classifications"]
    classification = [i["classification"] for i in classification_group]

    if bib["tail"] is None or bib["tail"]["bibliography"] is None:
        refcount = None
        refer_list = None
        string_title = None
    else:
        bibliography = bib["tail"]["bibliography"]
        refcount = bibliography["@refcount"]
        refer = bibliography["reference"]

        refer_list =[]
        if isinstance(refer, list):
          for d in refer:
            if "ref-title" in d["ref-info"]:
              ref_title =d["ref-info"]["ref-title"]["ref-titletext"]

            else:
              ref_title =" "
            refer_list.append(ref_title)
        else:
          if "ref-title" in refer["ref-info"]:
            ref_title = refer["ref-info"]["ref-title"]["ref-titletext"]
          else:
            ref_title = " "
          refer_list.append(ref_title)
        string_title = " ".join(refer_list)

    result_dict = {
        "Abstract": abstract,
        "Classification": classification,
        "Year": publication_year,
        "Reference_number": refcount,
        "Reference_title": refer_list,
        "Reference_title_str": string_title
    }

    return result_dict

def extract_idxterm(cat):
    m = "mainterm"
    if bool(cat["idxterms"]) and m in cat["idxterms"]:
        mainterm = cat["idxterms"][m]
        m_list = [i["$"] for i in mainterm] if isinstance(mainterm, list) else [mainterm["$"]]
        num_m = len(m_list)
    else:
        num_m = 0
        m_list = None

    result_dict = {
        "Number_mainterm": num_m,
        "Mainterms": m_list
    }

    return result_dict

def extract_affiliation(cat):
    affiliation = cat["affiliation"]

    aff_list =list()
    aff_name = list()
    aff_country = list()

    if isinstance(affiliation, list):
        aff_nset = set()
        aff_cset = set()
        j = 0
        for i in affiliation:
            if i["affilname"] ==None:
                university = "Unknown"
            else:
                university = i["affilname"]
            if i["affiliation-city"] ==None:
                city = "Unknown"
            else:
                city = i["affiliation-city"]
            if i["affiliation-country"] ==None:
                country = "Unknown"
            else:
                country = i["affiliation-country"]


            if country not in aff_cset:
                aff_country.append(country)
                aff_cset.add(country)
            if university not in aff_nset:
                aff_name.append(university)
                aff_nset.add(university)
                aff = (university, city, country)
                aff_list.append(aff)
    else:
      university = affiliation["affilname"]
      city = affiliation["affiliation-city"]
      country = affiliation["affiliation-country"]
      aff = (university, city, country)
      aff_list.append(aff)
      aff_name.append(university)
      aff_country.append(country)
    
    result_dict = {
        "Affiliation": aff_list,
        "University": aff_name,
        "Country": aff_country
    }

    return result_dict

def extract_coredata(cat):
    box = ["dc:title", "dc:publisher", "prism:publicationName", "subtypeDescription",
           "dc:description", "openaccess", "publishercopyright", "citedby-count"]
    column_map = {
        "prism:publicationName": "PublicationName",
        "subtypeDescription": "Type",
        "dc:title": "Title",
        "dc:description": "Description",
        "openaccess": "Openaccess",
        "dc:publisher": "Publisher",
        "publishercopyright": "Coppyrigth",
        "citedby-count": "Citation_Number"
    }
    coredata = cat["coredata"]
    result_dict = {}

    for i in box:
        if i in coredata:
            output = coredata[i]
        else:
            output = None
        a = column_map[i]
        result_dict[a] = output

    return result_dict

def extract_language(cat):
    language_dict = {}
    if bool(cat["language"]):
        language = cat["language"]["@xml:lang"]
    else:
        language = None
    language_dict["Language"] = language

    return language_dict

def extract_authkeywords(cat):
    authkeyword_dict = {}
    m = "author-keyword"
    if bool(cat["authkeywords"]) and m in cat["authkeywords"]:
        authkey = cat["authkeywords"]["author-keyword"]
        k_list = []
        if isinstance(authkey, list):
            num_k = len(authkey)
            for i in authkey:
                k_list.append(i["$"])
        else:
            num_k = 1
            k_list.append(authkey["$"])
        keyword = k_list
    else:
        num_k = 0
        keyword = None
    authkeyword_dict["Number_Keywords"] = num_k
    authkeyword_dict["Keywords"] = keyword

    return authkeyword_dict

def extract_subject_areas(cat):
    subject_areas_map = {}
    sub_area_dict = {}
    name_list = []
    sname_list = []
    if bool(cat["subject-areas"]["subject-area"]):
        sub_area = cat["subject-areas"]["subject-area"]
        if isinstance(sub_area, list):
            num_sub = len(sub_area)
            for i in range(num_sub):
                name = sub_area[i]["$"]
                short_name = sub_area[i]["@abbrev"]
                subject_areas_map[short_name] = name
                name_list.append(name)
                sname_list.append(short_name)
        sub_area_dict["Subject_Area"] = name_list
        sub_area_dict["Subject_Area_Code"] = sname_list
    else:
        sub_area_dict["Subject_Area"] = None
        sub_area_dict["Subject_Area_Code"] = None

    return sub_area_dict

def extract_authors(cat):
    author_dict = {}
    author = cat["authors"]["author"]
    number_author = len(author)
    index_name_list = []
    for name in range(number_author):
        index_name_list.append(author[name]['ce:indexed-name'])
    author_dict["Number_authors"] = number_author
    author_dict["Index_authors"] = index_name_list

    return author_dict

def main(file_path):
    cat = open_file(file_path)
    result_item = extract_item(cat)
    result_idxterm = extract_idxterm(cat)
    result_affiliation = extract_affiliation(cat)
    result_coredata = extract_coredata(cat)
    result_language = extract_language(cat)
    result_authkeywords = extract_authkeywords(cat)
    result_subject_areas = extract_subject_areas(cat)
    result_authors = extract_authors(cat)

    name = file_path.split("/")[-1]

    final_result = {
        "Id": name,
        **result_item,
        **result_idxterm,
        **result_affiliation,
        **result_coredata,
        **result_language,
        **result_authkeywords,
        **result_subject_areas,
        **result_authors,
    }

    return final_result

def init_redis():
    rd = redis.Redis(
        host=REDIS_SERVER.split(":")[0],
        port=REDIS_SERVER.split(":")[-1],
        encoding="utf-8",
        decode_responses=True
    )
    return rd

def produce(key, action):
    producer_config = {
        'bootstrap.servers': "localhost"
    }

    producer = Producer(producer_config)

    now = datetime.datetime.now().strftime("%Y-%m-%d %H:%M:%S")
    log = {
        "timestamp": now,
        "id": key,
        "device": platform.node(),
        "system": platform.system(),
        "action": action,
    }
    producer.produce(TOPIC, value=json.dumps(log))
    producer.flush()  # Make sure to flush to send the messages immediately

def consume():
    consumer_config = {
        'bootstrap.servers': "localhost",
        'group.id': 'my_consumer_group',
        'auto.offset.reset': 'earliest',
    }

    consumer = Consumer(consumer_config)
    consumer.subscribe([TOPIC])

    logs = []
    count_null = 0

    try:
        while count_null < 7:
            msg = consumer.poll(1.0)
            if msg is None:
                print("Message from consumer is None")
                count_null += 1
                continue
            if msg.error():
                if msg.error().code() == KafkaError._PARTITION_EOF:
                    print(KafkaError._PARTITION_EOF)
                    continue
                else:
                    print(msg.error())
                    break
            else:
                log = json.loads(msg.value())
                logs.append(log)
    except KeyboardInterrupt:
        pass
    finally:
        consumer.close()

def get_raw_paper(path_to_directory):
    raw_data = []
    for path, subdirs, files in os.walk(path_to_directory):
        for name in files:
            raw_data.append((path+"/"+name).replace("\\", "/"))

    structured_data = []
    for file_path in tqdm(raw_data):
        result = main(file_path)
        if len(result) != 27:
            print(result)
        structured_data.append(result)

    return structured_data