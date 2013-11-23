class Player(object):
    def __init__(self, name):
        self.name = name
        self.score = 0
        self.hand = None

    def __repr__(self):
        return "Player: {}, score: {}, hand: {}".format(self.name, self.score, self.hand)

    def add_score(self, points):
        self.score += points