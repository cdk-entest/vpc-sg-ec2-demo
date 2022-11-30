# haimtran 30 NOV 2022
# make the CPU hot by sending concurrent request 

import time
import requests
from concurrent.futures import ThreadPoolExecutor

NUM_CONCURRENT_REQUEST = 200
URL_CDK_AMPLIFY = "https://cdk.entest.io/"
URL_WELCOME_HAI = "https://cdk.entest.io/"


def send_one_request(id: int, url=URL_CDK_AMPLIFY):
    """
    send a request
    """
    print("send request {0} to {1}".format(id, url))
    requests.get(url=url)


def send_concurrent_request(num_concur_request=100):
    """
    send concurrent requests
    """
    with ThreadPoolExecutor(max_workers=num_concur_request) as executor:
        for k in range(1, num_concur_request):
            executor.submit(send_one_request, k)


if __name__ == "__main__":
    bucket_count = 1
    while True:
        print("send bucket {0} with {1}".format(
            bucket_count, NUM_CONCURRENT_REQUEST))
        send_concurrent_request(NUM_CONCURRENT_REQUEST)
        bucket_count += 1
        time.sleep(5)