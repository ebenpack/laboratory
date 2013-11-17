class Card(object):

    NUMBERS = {'A':1, '2':2, '3':3, '4':4, '5':5, '6':6, '7':7, '8':8, '9':9, '10':10, 'J':10, 'Q':10, 'K':10}
    SUITS = {'S':"\u2660", 'H':"\u2661", 'D':"\u2662", 'C':"\u2664"}
    SUITS = {'S':"S", 'H':"H", 'D':"D", 'C':"C"}
    CARD_ORDER = ['A', '2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K']
    SUIT_ORDER = ['D', 'C', 'H', 'S']
    b'\x80abc'

    def __init__(self, number, suit):
        self.number = number
        self.suit = suit
        self.value = Card.NUMBERS[number]

    def __str__(self):
        return "{}{}".format(self.number, Card.SUITS[self.suit])

    def __repr__(self):
        return "{}{}".format(self.number, Card.SUITS[self.suit])

    def __eq__(self, other):
        # Need equality to help with unittests.
        if self.number == other.number and self.suit == other.suit:
            return True
        else:
            return False

    def __lt__(self, other):
        if self.value < other.value:
            return True
        elif self.value > other.value:
            return False
        elif self.number == other.number:
            if Card.SUIT_ORDER.index(self.suit) < Card.SUIT_ORDER.index(other.suit):
                return True
            else:
                return False
        elif self.value == 10:
            return Card.CARD_ORDER.index(self.number) < Card.CARD_ORDER.index(other.number)
        else:
            raise Exception("I shouldn't be here")