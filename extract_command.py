from watson import text_to_trees

def extract_command(text):
    tree = text_to_trees(text)[0]
    return tree
