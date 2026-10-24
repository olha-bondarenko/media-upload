import httpx

from app.storage import CompletedPart, get_storage

storage = get_storage()
key = "checks/hello.txt"

upload_id = storage.create_multipart_upload(key, "text/plain")
print("1. Opened upload:", upload_id[:12], "…")

url = storage.presign_upload_part(key, upload_id, 1)
response = httpx.put(url, content=b"Hello from a multipart upload")
response.raise_for_status()
etag = response.headers["etag"]
print("2. Uploaded part 1, ETag:", etag)

storage.complete_multipart_upload(key, upload_id, [CompletedPart(part_number=1, etag=etag)])
print("3. Completed the upload")

download = httpx.get(storage.presign_download(key))
print("4. Downloaded:", download.status_code, download.text)
