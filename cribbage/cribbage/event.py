class Event(object):
    def discard(self):
        pass

    def play(self):
        pass

    def peg(self):
        pass

class OfflineEvent(Event):
    def discard(self, player):
        print("Your cards: {}".format(player.hand))
        discarded = []
        for _ in range(2):
            print("Player {}, Select a card (by index) to discard.".format(player.name))
            discarded.append(int(input()))
        return discarded

    def play(self, player):
        print("Your cards: {}".format(player.hand.unplayed))
        print("Select a card (by index) to play.")
        played = int(input())
        card = player.hand.play( played )
        return card

    def peg(self):
        pass

class MockEvent(Event):
    def discard(self, player):
        discarded = [0,1]
        return discarded

    def play(self, player):
        played = 0
        card = player.hand.play( played )
        return card

    def peg(self):
        pass