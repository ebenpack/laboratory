class Hand(object):
    def __init__(self, cards, crib=False):
        self.hand = sorted(cards)
        self.crib = crib
        self.played = []

    def __repr__(self):
        return "Hand: {}, crib: {}".format(self.hand, self.crib)

    def __len__(self):
        return len(self.hand)

    def __getitem__(self, key):
        return self.hand[key]

    def __setitem__(self, key, value):
        self.hand[key] = value
        self.hand.sort()

    def __iter__(self):
        return iter(self.hand)

    def __eq__(self, other):
        return all([ x == y for (x,y) in zip(self.hand, other.hand)  ])

    @property
    def unplayed(self):
        return sorted([card for card in self.hand if card not in self.played])

    def discard(self, cards):
        # Remove cards at indexes from hand, and return removed cards
        # cards is a list of indexes, which is sorted in reverse order so
        # we can pop values off without screwing up subsequent pops.
        discards = []
        for index in sorted(cards, reverse=True):
            discards.append(self.hand.pop(index))
        self.hand.sort()
        return sorted(discards)

    def clear_played(self):
        self.played = []

    def play(self, n):
        card = self.unplayed[n]
        self.played.append(card)
        self.played.sort()
        return card
