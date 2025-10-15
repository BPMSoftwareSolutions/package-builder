from functools import wraps
import time

def retry(max_attempts=3, delay=0.1):
    def decorator(fn):
        @wraps(fn)
        def wrapper(*args, **kwargs):
            for attempt in range(1, max_attempts + 1):
                try:
                    return fn(*args, **kwargs)
                except Exception as e:
                    if attempt == max_attempts:
                        print(f"[RETRY] Failed after {attempt} attempts.")
                        raise
                    else:
                        wait_time = delay * (2 ** (attempt - 1))
                        print(f"[RETRY] Attempt {attempt} failed with {e}. Retrying in {wait_time:.2f}s...")
                        time.sleep(wait_time)
        return wrapper
    return decorator


class BadInput(Exception):
    pass


@retry(max_attempts=3)
def parse_int(s):
    try:
        return int(s)
    except (ValueError, TypeError):
        raise BadInput(f"Invalid integer input: {s}")


# Example usage:
if __name__ == "__main__":
    print(parse_int("10"))     # ✅ Works
    print(parse_int("abc"))    # ❌ Retries 3 times, then raises BadInput
