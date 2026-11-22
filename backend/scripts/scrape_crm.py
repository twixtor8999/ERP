import urllib.request
import json
import os
import sys

VAULT = '5bcdcd8231159a7e9f43025a8a421e222a5f3e5d1af25fad'
BASE = f'https://firestore.googleapis.com/v1/projects/pk-ai-billing/databases/(default)/documents/vault/{VAULT}'

def fetch_json(url):
    req = urllib.request.Request(url, headers={'User-Agent': 'Mozilla/5.0'})
    with urllib.request.urlopen(req, timeout=30) as r:
        return json.loads(r.read().decode('utf-8'))

def pull_store_data(store_id):
    print(f"[*] Pulling store metadata for {store_id}...")
    meta_url = f"{BASE}/s/{store_id}"
    meta_doc = fetch_json(meta_url)
    if not meta_doc:
        print(f"[-] No metadata found for {store_id}")
        return None
    fields = meta_doc.get('fields', {})
    at_val = int(fields.get('at', {}).get('integerValue', 0))
    n_val = int(fields.get('n', {}).get('integerValue', 1))
    size_val = int(fields.get('size', {}).get('integerValue', 0))
    print(f"[*] Store {store_id}: expected {n_val} chunks, at={at_val}, size={size_val}")

    chunks = []
    page_token = None
    while True:
        url = f"{BASE}/s/{store_id}/c?pageSize=100"
        if page_token:
            url += f"&pageToken={page_token}"
        res = fetch_json(url)
        docs = res.get('documents', [])
        for d in docs:
            doc_id = d['name'].split('/')[-1]
            f = d.get('fields', {})
            d_at = int(f.get('at', {}).get('integerValue', 0))
            if at_val and d_at != at_val:
                continue
            t_str = f.get('t', {}).get('stringValue', '')
            chunks.append((doc_id, t_str))
        page_token = res.get('nextPageToken')
        if not page_token:
            break

    print(f"[*] Retrieved {len(chunks)} chunks for {store_id}")
    chunks.sort(key=lambda x: x[0])
    full_str = "".join([c[1] for c in chunks])
    print(f"[*] Concatenated string length: {len(full_str)}")
    try:
        data = json.loads(full_str)
        print(f"[+] Successfully parsed JSON for {store_id}!")
        return data
    except Exception as e:
        print(f"[-] JSON parse error for {store_id}: {e}")
        # Save raw to debug
        with open(f"/tmp/{store_id}_raw.json", "w") as f:
            f.write(full_str)
        return None

def pull_store_records(store_id):
    print(f"[*] Checking individual records /r for {store_id}...")
    records = []
    page_token = None
    while True:
        url = f"{BASE}/s/{store_id}/r?pageSize=300"
        if page_token:
            url += f"&pageToken={page_token}"
        try:
            res = fetch_json(url)
        except Exception as e:
            print(f"[-] No /r records or error: {e}")
            break
        docs = res.get('documents', [])
        for d in docs:
            rec_id = d['name'].split('/')[-1]
            f = d.get('fields', {})
            j_str = f.get('j', {}).get('stringValue', '')
            k_val = f.get('k', {}).get('stringValue', '')
            del_val = f.get('del', {}).get('integerValue', 0)
            if j_str and not del_val:
                try:
                    parsed = json.loads(j_str)
                    records.append({'k': k_val, 'id': rec_id, 'data': parsed})
                except Exception:
                    records.append({'k': k_val, 'id': rec_id, 'raw': j_str})
        page_token = res.get('nextPageToken')
        if not page_token:
            break
    print(f"[*] Total /r records for {store_id}: {len(records)}")
    return records

if __name__ == '__main__':
    all_stores_data = {}
    for sid in ['STmw5xjtmu', 'mwib0l2z', 'STmw5x75c1', 'STmvmej516', 'owner0']:
        data = pull_store_data(sid)
        if data:
            summary = {k: len(v) if isinstance(v, list) else type(v).__name__ for k, v in data.items()}
            print(f"Store {sid} summary: {summary}")
            all_stores_data[sid] = data
            # Check customers and skus count
            cust_count = len(data.get('cust', []))
            sku_count = len(data.get('skus', []))
            orders_count = len(data.get('orders', []))
            print(f"  --> cust: {cust_count}, skus: {sku_count}, orders: {orders_count}")

    # Also pull /r records
    all_r_records = {}
    for sid in ['STmw5xjtmu', 'owner0', 'mwib0l2z']:
        recs = pull_store_records(sid)
        if recs:
            all_r_records[sid] = recs

    output_path = "backend/scripts/scraped_crm_data.json"
    with open(output_path, "w") as f:
        json.dump({'stores': all_stores_data, 'r_records': all_r_records}, f, indent=2)
    print(f"\n[SUCCESS] Dumped all CRM data to {output_path}")
