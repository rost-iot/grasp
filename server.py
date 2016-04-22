from flask import Flask, request, render_template
import os
from match_commands import match_commands
import json

app = Flask(__name__)

@app.route("/api/match_commands", methods=["POST"])
def match_commands_api():
        form = request.form
        response = "error connecting. Lorentz is a shitty programmer"
        if 'commands' and 'text' in form:
            commands = json.loads(form.get('commands'))
            text = form.get('text')
            print(text)
            print(commands)
            response = match_commands(text, commands)
        return json.dumps(response)

port = int(os.getenv("VCAP_APP_PORT", "5000"))
host = os.getenv("VCAP_APP_HOST", "localhost")
app.run(port=port, host=host)

