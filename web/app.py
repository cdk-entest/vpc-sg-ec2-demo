"""
haimtran 19 NOV 2022
add host and username
run port 80 needs amind permisson
"""

import os
import socket
from flask import Flask, render_template

app = Flask(
    __name__, static_url_path="", static_folder="static", template_folder="template"
)


try:
    USER_NAME = os.environ["USER_NAME"]
except:
    USER_NAME = "Hai Tran"


@app.route("/")
def hello_world():
    """
    home page
    """
    return app.send_static_file("index.html")


@app.route("/host")
def get_host():
    """
    host page
    """
    host = socket.gethostname()
    return render_template("host.html", host=host, username=USER_NAME)


if __name__ == "__main__":
    # fetch_data()
    app.run(host="0.0.0.0", port=80)
