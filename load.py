from http import client
from operator import le
from urllib import response
from dotenv import load_dotenv
load_dotenv()
import os
from openai import OpenAI
from pinecone import Pinecone, ServerlessSpec
import json
from webscrape import scrapAndEmbed
from sys import argv



def insertFromJson():
    pc = Pinecone(api_key=os.getenv('PINECONE_API_KEY'))
    index_name = "rag"

    if index_name not in pc.list_indexes().names():
        pc.create_index(
            name = index_name, dimension = 1536, metric = "cosine", spec = ServerlessSpec(cloud = "aws", region = "us-east-1")
    )

    data = json.load(open("/home/ana/frontend/Headstarter/ai-rate-my-prof/reviews.json"))

    processed_data = []
    client = OpenAI()
    index = pc.Index('rag')

    for review in data['reviews']:
        response = client.embeddings.create(
            input = review['review'],
            model = "text-embedding-ada-002",
        )
        embedding = response.data[0].embedding
        processed_data.append({
            "values": embedding,
            "id": review["professor"],
            "metadata": {
                "name": review["professor"],
                "review": review["review"],
                "subject": review["subject"],
                "stars": review["stars"]
            }
        })
    index.upsert(
        vectors = processed_data,
        namespace = "ns1"
    )

def isInIndex(index,ns, id):
    queries = index.query(
    namespace=ns,
    id=id,
    top_k=3,
    include_values=False
    )
    
    


def embedReview(link):
    review = scrapAndEmbed(link)
    processed_data = []
    pc = Pinecone(api_key=os.getenv('PINECONE_API_KEY'))
    client = OpenAI()
    index_name = "rag"
    if index_name not in pc.list_indexes().names():
        pc.create_index(
            name = index_name, dimension = 1536, metric = "cosine", spec = ServerlessSpec(cloud = "aws", region = "us-east-1")
    )
    index = pc.Index(index_name)
    response = client.embeddings.create(
        input = review['review'],
        model = "text-embedding-3-small",
    )
    embedding = response.data[0].embedding
    processed_data.append({
        "values": embedding,
        "id": review["professor"],
        "metadata": {
            "name": review["professor"],
            "review": review["review"],
            "subject": review["subject"],
            "stars": review["stars"]
        }
    })
    index.upsert(
        vectors = processed_data,
        namespace = "ns1"
    )

if __name__ == "__main__":
    # Read the input from command line arguments
    input_data = argv[1]
    # Call the function and print the result
    embedReview(input_data)
    


