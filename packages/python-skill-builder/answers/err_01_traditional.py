class BadInput(Exception):
    pass


def parse_int(s):
    try:
        return int(s)
    except (ValueError, TypeError):
        raise BadInput(f"Invalid integer input: {s}")
