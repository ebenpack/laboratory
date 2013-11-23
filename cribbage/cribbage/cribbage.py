import itertools
import random
import cribbage.scoring as scoring
from cribbage.card import Card
from cribbage.hand import Hand
from cribbage.event import OfflineEvent


class Cribbage(object):

    DECK = tuple((Card(n, s) for n, s in itertools.product(Card.CARD_ORDER, Card.SUIT_ORDER)))

    def __init__(self, players, event_handler=OfflineEvent):
        # _dealer and _current_player are integer indexes of the players list
        self.players = players
        self.number_of_players = len(players)
        self.previous_loser = None
        self.event_dispatch = event_handler()
        self.crib = []
        self._dealer = None
        self._current_player = None
        self.starter = None

    def __repr__(self):
        return "Players: {}, Dealer: {}".format(self.players, self.dealer)

    @property
    def dealer(self):
        return self.players[self._dealer]

    @property
    def _non_dealer(self):
        # This kind of assumes a 2-player game.
        return (self._dealer + 1) % self.number_of_players

    @property
    def non_dealer(self):
        return self.players[self._non_dealer]

    @property
    def current_player(self):
        return self.players[self._current_player]

    def set_current_player(self, player):
        self._current_player = player

    def switch_current_player(self):
        self._current_player = (self._current_player + 1) % self.number_of_players

    def switch_dealer(self):
        self._dealer = self._non_dealer

    def deal_pool(self):
        # Returns a pool of unique cards sufficient for a single hand consisting of n players
        # ( ((n*6)+1), each player getting six cards, plus the starter card )
        return random.sample(Cribbage.DECK, ((self.number_of_players*6)+1))

    def draw(self):
        # TODO: If player won previous game, they get to deal next
        if not self._dealer:
            self._dealer = random.choice(range(self.number_of_players))
        else:
            self._dealer = self.previous_winner

    def deal(self):
        cards = self.deal_pool()
        for i, player in enumerate(self.players):
            player.hand = Hand(cards[i*6:((i+1)*6)])
        self.starter = cards[-1]

    def go(self, current_play):
        # TODO: Player will get 3 points if 31 (GO plus 31). Is this correct? Or only 2 points?
        score = 1
        while self.can_go(current_play):
            played = self.event_dispatch.play(self.current_player)
            current_play.append(played)
            score += scoring.score_play(current_play)

        if scoring.play_total(current_play) == 31:
                score += 2
        self.current_player.add_score(score)

    def discard(self):
        crib = self.event_dispatch.discard(self.players)
        self.crib = Hand(sorted(crib), crib=True)

    def play(self):
        # TODO: SIMPLIFY? MAKE PLAY CLASS?
        self.set_current_player(self._non_dealer)
        for player in self.players:
            player.hand.clear_played()

        current_play = []
        # While there are still unplayed cards in the players' hands
        while any([len(p.hand.played) < 4 for p in self.players]):

            if not self.current_player.hand.unplayed:
                self.switch_current_player()

            # If the current player cannot play a card that is less than 31
            # I.e. GO
            if not self.can_go(current_play):
                self.switch_current_player()
                self.go(current_play)
                self.switch_current_player()
                current_play = []

            played = self.event_dispatch.play(self.current_player)
            current_play.append(played)
            
            score = scoring.score_play(current_play)
            self.current_player.add_score(score)

            self.switch_current_player()

        #last card
        self.switch_current_player()
        self.current_player.add_score(1)

    def can_go(self, current_play):
        return (self.current_player.hand.unplayed and
                (scoring.play_total(current_play + [min(self.current_player.hand.unplayed)]) <= 31))

    def peg(self, player, hand):
        player_counted_score = self.event_dispatch.peg(player)
        actual_score = scoring.score_peg(hand, self.starter)

        muggins = self.event_dispatch.muggins()
        if not muggins and player_counted_score == actual_score:
            player.add_score(actual_score)
        else:
            # TODO: What happens if muggins falsely declared?
            # TODO: What happens if player counts score too high?
            pass

    def play_peg(self):
        players = [self.non_dealer, self.dealer]
        for player in players:
            self.peg(player, player.hand)
        self.peg(self.dealer, self.crib)

    def play_crib(self):
        self.peg(self.dealer, self.crib)

    def reveal_starter(self):
        # TODO: FILL THIS OUT

        # His heels
        if self.starter.number == "J":
            self.dealer.add_score(2)

    def play_round(self):
        self.deal()
        self.discard()
        self.reveal_starter()
        self.play()
        self.play_peg()
        self.switch_dealer()

    def start(self):
        self.draw()
        while max([p.score for p in self.players]) < 121:
            self.play_round()
        # TODO: Post-game
