#TODO: Refactor events. Initialize w/ players?

class Event(object):
    def discard(self):
        pass

    def play(self):
        pass

    def peg(self):
        pass

    def muggins(self):
        pass


class OfflineEvent(Event):
    def discard(self, players):
        crib = []
        for player in players:
            discarded = []
            print("Your cards: {}".format(player.hand.unplayed))
            for _ in range(2):
                print("Player {}, Select a card (by index) to discard.".format(player.name))
                discarded.append(int(input()))
            crib.extend(player.hand.discard(discarded))
        return crib

    def play(self, player):
        print("Your cards: {}".format(player.hand.unplayed))
        print("Select a card (by index) to play.")
        played = int(input())
        card = player.hand.play(played)
        return card

    def peg(self, player):
        print("Your cards: {}".format(player.hand))
        print("How many points in your hand?")
        score = int(input())
        return score

    def muggins(self):
        print("How many muggins?")
        points = int(input())
        return points


class MockEvent(Event):
    def discard(self, players):
        crib = []
        for player in players:
            discarded = [0, 1]
            crib.extend(player.hand.discard(discarded))
        return crib

    def play(self, player):
        played = 0
        card = player.hand.play(played)
        return card

    def peg(self, player):
        return 0

    def muggins(self):
        pass