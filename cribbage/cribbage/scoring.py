from cribbage.card import Card

def score_fifteens(cards):
    pass

def score_pairs(cards):
    score = 0
    for i in range(4,1,-1):
        if len(cards) >= i and all(c.number == cards[-1].number for c in cards[-i:]):
            score += i*(i-1)
            break
    return score

def score_runs(cards):
    score = 0
    for i in range(5,2,-1):
        if len(cards) >= i and is_run(cards[-i:]):
            score += i
            break
    return score

def score_flush(cards):
    score = 0
    for i in range(5,3,-1):
        if len(cards) >= i and is_flush(cards[-i:]):
            score += i
            break
    return score

def is_run(cards):
    sc = sorted(cards)
    lc = len(cards)
    first_card = Card.CARD_ORDER.index(sc[0].number)
    if Card.CARD_ORDER[first_card:first_card+lc] == [c.number for c in sc]:
        return True
    else:
        return False

def is_flush(cards):
    # TODO: crib check
    # if crib:
    #     pass
    if all(c.suit == cards[-1].suit for c in cards):
        return True
    else:
        return False

def play_total(cards):
    total = 0
    for c in cards:
        total += c.value
    return total

def score_play(cards):
    score = 0

    if play_total(cards) == 15:
        score += 2

    score += score_pairs(cards)
    score += score_runs(cards)
    score += score_flush(cards)

    return score