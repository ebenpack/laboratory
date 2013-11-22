import itertools
import functools
import operator
from cribbage.card import Card


def play_pairs(cards):
    score = 0
    for i in range(4, 1, -1):
        if len(cards) >= i and all(c.number == cards[-1].number for c in cards[-i:]):
            score += i*(i-1)
            break
    return score


def play_runs(cards):
    score = 0
    for i in range(5, 2, -1):
        if len(cards) >= i and is_run(cards[-i:]):
            score += i
            break
    return score


def play_flush(cards):
    score = 0
    for i in range(5, 3, -1):
        if len(cards) >= i and is_flush(cards[-i:]):
            score += i
            break
    return score


def score_fifteens(cards):
    score = 0
    for i in range(2, len(cards)+1):
        combos = itertools.combinations(cards, i)
        for c in combos:
            if play_total(c) == 15:
                score += 2
    return score


def peg_runs(cards):

    def max_run(seq):
        maxrun = -1
        maxend = -1
        runlen = {}
        for card in seq:
            num = Card.CARD_ORDER.index(card) + 1
            currentrun = runlen[num] = runlen.get(num-1, 0) + 1
            if currentrun > maxrun:
                maxend, maxrun = num, currentrun
        return Card.CARD_ORDER[maxend-maxrun:maxend]

    score = 0
    groups = []
    uniquekeys = []
    cards = sorted(cards)
    # Group cards by card number (e.g. [[AS, AD], [2S, 2H], [3C]])
    for k, g in itertools.groupby(cards, lambda c: c.number):
        groups.append(list(g))
        uniquekeys.append(k)
    # Find longest run of cards (hand length will always be five, so we don't need to worry about having multiple
    # non-consecutive runs like 2,3,4,6,7,8)
    run = max_run(uniquekeys)
    if len(run) >= 3:
        # The multiplier is the product of the lengths of each group in the run. So a plain run will have a multiplier
        # of 1, a double run will have a multiplier of 2, a triple run will have a multiplier of 3, a double-double run
        # will have a multiplier of 4. The overall run score is the product of the multiplier and the length of the run.
        multiplier = functools.reduce(operator.mul, [len(x) for x in groups if x[0].number in run], 1)
        score = len(run) * multiplier
    return score


def peg_pairs(cards):
    groups = []
    cards = sorted(cards)
    # Group cards by card number (e.g. [[AS, AD], [2S, 2H], [3C]])
    for k, g in itertools.groupby(cards, lambda c: c.number):
        groups.append(list(g))
    score = sum([len(x) * (len(x) - 1) for x in groups if len(x) > 1])
    return score


def peg_flush(cards, starter, crib=False):
    score = 0
    cards = sorted(cards)
    if is_flush(cards, starter, crib):
        if crib:
            score = 5
        else:
            score = 4
            if cards[0].suit == starter.suit:
                score += 1
    return score


def is_run(cards):
    sc = sorted(cards)
    lc = len(cards)
    first_card = Card.CARD_ORDER.index(sc[0].number)
    if Card.CARD_ORDER[first_card:first_card+lc] == [c.number for c in sc]:
        return True
    else:
        return False


def is_flush(cards, starter=None, crib=False):
    # TODO: crib check
    if crib:
        if all(c.suit == cards[0].suit for c in cards + [starter]):
            return True
        else:
            return False
    elif all(c.suit == cards[0].suit for c in cards):
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
    score += play_pairs(cards)
    score += play_runs(cards)
    score += play_flush(cards)
    return score


def score_peg(hand, starter, crib=False):
    cards = sorted(hand.hand + [starter])
    score = 0
    score += score_fifteens(cards)
    score += peg_pairs(cards)
    score += peg_runs(cards)
    score += peg_flush(hand.hand, starter, crib)
    if Card('J', starter.suit) in hand:
        score += 1
    return score
