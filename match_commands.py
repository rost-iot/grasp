from watson import text_to_trees
from get_distance import get_distance

def match_commands(text, known_commands):
    entered_command = text_to_trees(text)[0]
    for command in known_commands:
        distance = get_distance(entered_command, command['command'])
        command['distance'] = distance
    return known_commands 
