from flask import Flask, request, render_template
import os
import json
from match_commands import match_commands
from watson.call_watson import call_watson

app = Flask(__name__)

@app.route("/api/match_commands", methods=["POST"])
def match_commands_api():
    form = request.form
    response = "error connecting. Lorentz is a shitty programmer"
    if 'commands' and 'text' in form:
        commands = json.loads(form.get('commands'))
        text = form.get('text')
        response = match_commands(text, commands)
    return json.dumps(response)

@app.route('/api/format_command', methods=['POST'])
def format_command():
    form = request.form
    response = "error connecting. Lorentz is a shitty programmer"
    if 'text' in form:
        text = form.get('text')
        command = call_watson(text)[0]
        response = command
    return json.dumps(response)

port = int(os.getenv("VCAP_APP_PORT", "5000"))
host = os.getenv("VCAP_APP_HOST", "localhost")
app.run(port=port, host=host)

