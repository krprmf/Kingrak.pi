from fastapi import FastAPI
from confluent_kafka import Producer, Consumer, KafkaError
from scopus import get_papers
from scopus import (
    get_papers
)
import json
import redis
import datetime
import platform
from pydantic import BaseModel

KAFKA_SERVER = "localhost:9093"
TOPIC = "event_log"
GROUP_ID = "event_log_group"

app = FastAPI()

rd = redis.Redis(
        host="localhost",
        port="6379",
        encoding="utf-8",
        decode_responses=True
    )

def produce(key, action):
    producer_config = {
        'bootstrap.servers': KAFKA_SERVER
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
    producer.produce("events", value=json.dumps(log))
    rd.set(f"paper:log:{key}", json.dumps(log))
    producer.flush()  # Make sure to flush to send the messages immediately

class Item(BaseModel):
    api_key: str
    title: str | None = None
    count: int | None = None

@app.post("/scopus_api")
def post_scopus_api(item: Item):
    papers = get_papers(item)
    keys_scopus = rd.keys("paper:scopus:*")
    scopus_id = len(keys_scopus) + 1
    for paper in papers:
        rd.set(f'paper:scopus:{scopus_id}', json.dumps(paper))
        scopus_id += 1

    keys_log = rd.keys("paper:log:*")
    produce(len(keys_log) + 1, f"{scopus_id-len(keys_scopus)-1} has been added")

    return {"status": "Successfully scrape papers from scopus api", "data": papers}

@app.get("/scopus_api")
def get_scopus_api():
    keys_scopus = rd.keys("paper:scopus:*")

    keys_log = rd.keys("paper:log:*")
    produce(len(keys_log) + 1, "Fetch all scopus papers")
    raw_data = rd.mget(keys_scopus)
    data = [json.loads(d) for d in raw_data]
    return {"status": "Successfully get all papers from redis", "data": data}

@app.get("/event_log")
def get_event_log():
    consumer_config = {
        'bootstrap.servers': 'localhost:9093',
        'group.id': 'event_log_group',
        'auto.offset.reset': 'earliest',
    }

    consumer = Consumer(consumer_config)
    consumer.subscribe(['events'])

    print('Running Consumer')
    count_null = 0

    try:
        while count_null < 5:
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
                print(log)
    except KeyboardInterrupt:
        pass
    finally:
        consumer.close()
    
    keys_log = rd.keys("paper:log:*")
    logs = rd.mget(keys_log)
    data = [json.loads(d) for d in logs]
    return {"status": "Successfully get all event logs", "data": data}

@app.get("/")
async def root():
    return {"message": "Server successsfully running on localhost port 52347"}