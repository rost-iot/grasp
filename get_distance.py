from watson.sentence_tree import _string_to_trees, _compile_tree_list
import pattern_tools as pt

def get_distance(command1, command2):
    distance = 0
    command1 = format_command(command1)
    command2 = format_command(command2)
    distance += get_pattern_distance(command1, command2, pt.match_POS('vb'))
    distance += get_pattern_distance(command1, command2, pt.match_gram('dobj'))
    return distance

def format_command(command):
    if type(command) is str:
        words = _string_to_trees(command)
        command = _compile_tree_list(words)
    return command

def get_word_distance(word1, word2):
    if not word1 or not word2:
        return 1 #subject to change
    if word1.word == word2.word:
        return 0
    return 1

def get_pattern_distance(command1, command2, pattern):
    word1 = pt.find_node(command1, pattern)
    word2 = pt.find_node(command2, pattern)
    distance = get_word_distance(word1, word2)
    return distance
