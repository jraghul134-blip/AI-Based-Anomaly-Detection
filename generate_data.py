import csv
import random

def generate_network_data(filename, num_records=1000, anomaly_rate=0.05):
    with open(filename, 'w', newline='') as f:
        writer = csv.writer(f)
        writer.writerow(['packet_id', 'bytes_in', 'bytes_out', 'duration_ms', 'src_port', 'dst_port'])
        
        for i in range(num_records):
            is_anomaly = random.random() < anomaly_rate
            
            if is_anomaly:
                # Anomalous traffic (e.g. data exfiltration, port scan, huge payload)
                bytes_in = random.randint(50000, 1000000)
                bytes_out = random.randint(100000, 5000000)
                duration = random.randint(1000, 10000)
                src_port = random.randint(1024, 65535)
                dst_port = random.choice([22, 3389, 445]) # Target vulnerable ports
            else:
                # Normal web traffic
                bytes_in = random.randint(100, 5000)
                bytes_out = random.randint(500, 15000)
                duration = random.randint(10, 500)
                src_port = random.randint(1024, 65535)
                dst_port = random.choice([80, 443])
                
            writer.writerow([i+1, bytes_in, bytes_out, duration, src_port, dst_port])

if __name__ == '__main__':
    generate_network_data('sample_network_traffic.csv')
    print("Generated sample_network_traffic.csv")
