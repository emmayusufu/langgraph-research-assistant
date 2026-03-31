import socket
import threading
import re

LISTEN_HOST = "0.0.0.0"
LISTEN_PORT = 2375
DOCKER_SOCK = "/var/run/docker.sock"


def forward_responses(upstream: socket.socket, client: socket.socket) -> None:
    try:
        while True:
            data = upstream.recv(4096)
            if not data:
                break
            client.sendall(data)
    except OSError:
        pass
    finally:
        upstream.close()
        client.close()


def handle(client: socket.socket, upstream_addr: str) -> None:
    upstream = socket.socket(socket.AF_UNIX, socket.SOCK_STREAM)
    upstream.connect(upstream_addr)
    buf = b""
    header_done = False

    while True:
        chunk = client.recv(4096)
        if not chunk:
            break
        if not header_done:
            buf += chunk
            if b"\r\n\r\n" in buf:
                header_end = buf.index(b"\r\n\r\n") + 4
                headers_raw = buf[:header_end].decode("utf-8", errors="replace")
                body_so_far = buf[header_end:]
                rewritten = re.sub(
                    r"(GET|POST|PUT|PATCH|DELETE|HEAD|OPTIONS) /v(\d+\.\d+)/",
                    lambda m: f"{m.group(1)} /v1.44/" if float(m.group(2)) < 1.44 else m.group(0),
                    headers_raw,
                    count=1,
                )
                upstream.sendall(rewritten.encode() + body_so_far)
                header_done = True
        else:
            upstream.sendall(chunk)

    threading.Thread(target=forward_responses, args=(upstream, client), daemon=True).start()


def main():
    server = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
    server.setsockopt(socket.SOL_SOCKET, socket.SO_REUSEADDR, 1)
    server.bind((LISTEN_HOST, LISTEN_PORT))
    server.listen(128)
    while True:
        client, _ = server.accept()
        threading.Thread(target=handle, args=(client, DOCKER_SOCK), daemon=True).start()


if __name__ == "__main__":
    main()
