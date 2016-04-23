from watson import text_to_trees
from get_distance import get_distance
import sys
import json

def match_commands(text, known_commands):
    entered_command = text_to_trees(text)[0]
    for command in known_commands:
        distance = get_distance(entered_command, command['signature'])
        command['distance'] = distance
    return known_commands 

if __name__ == '__main__':
    args = sys.argv
    text = args[1]
    known_commands = json.loads(args[2])
    results = match_commands(text, known_commands)
    print(results)
    sys.stdout.flush()
