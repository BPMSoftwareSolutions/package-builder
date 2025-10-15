def even_squares(nums):
    result = []
    for n in nums:
        if n % 2 == 0:
            result.append(n ** 2)
    return result
