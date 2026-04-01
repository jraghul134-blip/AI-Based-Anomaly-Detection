import requests
with open('sample_network_traffic.csv', 'rb') as f:
    files = {'file': f}
    response = requests.post('http://127.0.0.1:8000/detect_anomalies', files=files)
print(response.status_code)
print(response.text[:200])
