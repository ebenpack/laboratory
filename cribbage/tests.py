import unittest

cover = False

if cover:
    import coverage
    cov = coverage.coverage(branch=True,
                            omit=['tests.py', 'cribbage/__init__.py'])
    cov.exclude('def __repr__')
    cov.exclude('def __str__')
    cov.start()

import os
import cribbage.scoring as scoring
from cribbage.event import MockEvent
from cribbage.player import Player
from cribbage.hand import Hand
import cribbage.cribbage as cribbage
import random

D = {card.number + card.suit: card for card in cribbage.Cribbage.DECK}

class TestCard(unittest.TestCase):
    def setUp(self):
        self.CARD_ORDER = ['A', '2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K']
        self.SUIT_ORDER = ['D', 'C', 'H', 'S']

    def test_card_ordering(self):
        # Card ordering is used for sorting cards in a hand. This is used for presenting the cards to the player,
        # and is also important to some scoring functions (e.g. scoring runs).
        for i, number1 in enumerate(self.CARD_ORDER):
            for j, suit1 in enumerate(self.SUIT_ORDER):
                for number2 in self.CARD_ORDER[i+1:]:
                    for suit2 in self.SUIT_ORDER:
                        self.assertLess(D[number1+suit1], D[number2+suit2])

    def test_card_values(self):
        for i, number in enumerate(self.CARD_ORDER[:10], start=1):
            for suit in self.SUIT_ORDER:
                self.assertEqual(D[number+suit].value, i)

        for number in self.CARD_ORDER[9:]:
            for suit in self.SUIT_ORDER:
                self.assertEqual(D[number+suit].value, 10)


class TestHand(unittest.TestCase):
    def setUp(self):
        self.hand1 = Hand([D['9C'], D['9D'], D['9H'], D['AS'], D['9S'], D['AC']])
        self.hand2 = Hand([D['10D'], D['JH'], D['9C'], D['KS'], D['QS'], D['JC']])

    def test_simple_hand_sorting(self):
        self.assertEqual(self.hand1.hand, [D['AC'], D['AS'], D['9D'], D['9C'], D['9H'], D['9S']])
        self.assertEqual(self.hand2.hand, [D['9C'], D['10D'], D['JC'], D['JH'], D['QS'], D['KS']])

    def test_hand_sorting(self):
        for i in range(5000):
            hand = Hand(random.sample(cribbage.Cribbage.DECK, 6))
            for i, card1 in enumerate(hand.hand):
                for card2 in hand.hand[i+1:]:
                    self.assertLess(card1, card2)

    def test_simple_hand_length(self):
        self.assertEqual(len(self.hand1), 6)
        self.assertEqual(len(self.hand2), 6)

    def test_hand_length(self):
        for i in range(20):
            hand = Hand(random.sample(cribbage.Cribbage.DECK, i))
            self.assertEqual(len(hand), i)

    def test_hand_getitem(self):
        self.assertEqual(self.hand1[0], D['AC'])
        self.assertEqual(self.hand1[5], D['9S'])

    def test_hand_setitem(self):
        # setitem replaces the card at the given index, and immediately re-sorts the hand. So as is seen below, setting
        # a card to particular index does not guarantee that the card will remain at that index.
        self.hand1[5] = D['JS']
        self.assertEqual(self.hand1[5], D['JS'])
        self.hand1[5] = D['3S']
        self.assertEqual(self.hand1[5], D['9H'])
        self.assertEqual(self.hand1[2], D['3S'])

    def test_simple_hand_discard(self):
        self.assertEqual(len(self.hand1), 6)
        discarded1 = self.hand1.discard([0, 2])
        self.assertEqual(self.hand1.hand, [D['AS'], D['9C'], D['9H'], D['9S']])
        self.assertEqual(discarded1, [D['AC'], D['9D']])
        self.assertEqual(len(self.hand1), 4)

        self.assertEqual(len(self.hand2), 6)
        discarded2 = self.hand2.discard([2, 3])
        self.assertEqual(self.hand2.hand, [D['9C'], D['10D'], D['QS'], D['KS']])
        self.assertEqual(discarded2, [D['JC'], D['JH']])
        self.assertEqual(len(self.hand1), 4)

    def test_hand_discard(self):
        hand = Hand(cribbage.Cribbage.DECK)
        for i in range(len(hand)):
            discarded = hand.discard([0])
            self.assertEqual(discarded[0], cribbage.Cribbage.DECK[i])

    def test_hand_play(self):
        self.assertEqual(self.hand1.played, [])
        self.assertEqual(self.hand1.unplayed, self.hand1.hand)

        self.hand1.play(0)
        self.assertEqual(self.hand1.played, [D['AC']])
        self.assertEqual(self.hand1.unplayed, [D['AS'], D['9D'], D['9C'], D['9H'], D['9S']])

        self.hand1.play(4)
        self.assertEqual(self.hand1.played, [D['AC'], D['9S']])
        self.assertEqual(self.hand1.unplayed, [D['AS'], D['9D'], D['9C'], D['9H']])

        self.hand1.play(2)
        self.assertEqual(self.hand1.played, [D['AC'], D['9C'], D['9S']])
        self.assertEqual(self.hand1.unplayed, [D['AS'], D['9D'], D['9H']])

        self.hand1.play(0)
        self.assertEqual(self.hand1.played, [D['AC'], D['AS'], D['9C'], D['9S']])
        self.assertEqual(self.hand1.unplayed, [D['9D'], D['9H']])

        self.hand1.play(0)
        self.assertEqual(self.hand1.played, [D['AC'], D['AS'], D['9D'], D['9C'], D['9S']])
        self.assertEqual(self.hand1.unplayed, [D['9H']])

        self.hand1.play(0)
        self.assertEqual(self.hand1.played, self.hand1.hand)
        self.assertEqual(self.hand1.unplayed, [])

        self.hand1.clear_played()
        self.assertEqual(self.hand1.played, [])
        self.assertEqual(self.hand1.unplayed, self.hand1.hand)


class TestPlayer(unittest.TestCase):
    def setUp(self):
        self.player1 = Player("Alice")
        self.player2 = Player("Bob")

    def test_player(self):
        self.assertEqual(self.player1.name, "Alice")
        self.assertEqual(self.player2.name, "Bob")
        self.assertEqual(self.player1.score, 0)
        self.assertEqual(self.player2.score, 0)

    def test_add_score(self):
        total = 0
        for i in range(100):
            total += 1
            self.player1.add_score(1)
            self.assertEqual(self.player1.score, total)
            self.player2.add_score(1)
            self.assertEqual(self.player2.score, total)



class TestCribbageDealer(unittest.TestCase):
    def setUp(self):
        random.seed(23)
        self.player1 = Player("Alice")
        self.player2 = Player("Bob")
        self.game = cribbage.Cribbage([self.player1, self.player2], MockEvent)
        self.game.draw()
        self.game.deal()
        self.game.set_current_player(self.game._non_dealer)

    def test_dealer(self):
        self.assertEqual(self.game.dealer, self.player2)

    def test_previous_dealer(self):
        self.game.previous_winner = 0
        self.game.draw()
        self.assertEqual(self.game.dealer, self.player1)

    def test_non_dealer(self):
        self.assertEqual(self.game.non_dealer, self.player1)

    def test_current_player(self):
        self.assertEqual(self.game.current_player, self.player1)

    def test_simple_switch_current_player(self):
        self.assertEqual(self.game.current_player, self.player1)
        self.game.switch_current_player()
        self.assertEqual(self.game.current_player, self.player2)

    def test_switch_current_player(self):
        for i in range(5000):
            if i % 2 == 0:
                self.assertEqual(self.game.current_player, self.player1)
            else:
                self.assertEqual(self.game.current_player, self.player2)
            self.game.switch_current_player()
            if i % 2 == 0:
                self.assertEqual(self.game.current_player, self.player2)
            else:
                self.assertEqual(self.game.current_player, self.player1)

    def test_simple_switch_dealer(self):
        self.assertEqual(self.game.dealer, self.player2)
        self.assertEqual(self.game.non_dealer, self.player1)
        self.game.switch_dealer()
        self.assertEqual(self.game.dealer, self.player1)
        self.assertEqual(self.game.non_dealer, self.player2)

    def test_switch_dealer(self):
        for i in range(5000):
            if i % 2 == 0:
                self.assertEqual(self.game.dealer, self.player2)
                self.assertEqual(self.game.non_dealer, self.player1)
            else:
                self.assertEqual(self.game.dealer, self.player1)
                self.assertEqual(self.game.non_dealer, self.player2)
            self.game.switch_dealer()
            if i % 2 == 0:
                self.assertEqual(self.game.dealer, self.player1)
                self.assertEqual(self.game.non_dealer, self.player2)
            else:
                self.assertEqual(self.game.dealer, self.player2)
                self.assertEqual(self.game.non_dealer, self.player1)

    def test_simple_deal(self):
        self.assertEqual(len(self.game.dealer.hand), 6)
        self.assertIsInstance(self.game.dealer.hand, Hand)
        self.assertEqual(len(self.game.non_dealer.hand), 6)
        self.assertIsInstance(self.game.non_dealer.hand, Hand)
        self.assertIsInstance(self.game.starter, cribbage.Card)

        self.assertEqual(self.game.dealer.hand, Hand([D['3D'], D['4D'], D['5C'], D['6H'], D['8D'], D['9C']]))
        self.assertEqual(self.game.non_dealer.hand, Hand([D['AC'], D['2C'], D['5S'], D['7D'], D['7S'], D['10C']]))
        self.assertEqual(self.game.starter, D['AD'])

    def test_simple_deal(self):
        for i in range(1000):
            self.game.deal()
            self.assertEqual(len(self.game.dealer.hand), 6)
            self.assertIsInstance(self.game.dealer.hand, Hand)
            self.assertEqual(len(self.game.non_dealer.hand), 6)
            self.assertIsInstance(self.game.non_dealer.hand, Hand)
            self.assertIsInstance(self.game.starter, cribbage.Card)
            self.assertEqual(self.game.dealer.hand.hand, self.game.dealer.hand.unplayed)
            self.assertEqual(self.game.non_dealer.hand.hand, self.game.non_dealer.hand.unplayed)
            self.assertEqual(self.game.dealer.hand.played, [])
            self.assertEqual(self.game.non_dealer.hand.played, [])


class TestCribbageDiscardPlay(unittest.TestCase):
    def setUp(self):
        random.seed(23)
        self.player1 = Player("Alice")
        self.player2 = Player("Bob")
        self.game = cribbage.Cribbage([self.player1, self.player2], MockEvent)
        self.game.draw()
        self.game.deal()

        self.h1 = Hand([D['5C'], D['6H'], D['8D'], D['9C']])
        self.h2 = Hand([D['5S'], D['7D'], D['7S'], D['10C']])
        self.crib = Hand([D['AC'], D['2C'], D['3D'], D['4D']])

    def test_discard(self):
        self.assertEqual(self.game.crib, [])
        self.game.discard()
        self.assertEqual(self.game.crib, Hand([D['AC'], D['2C'], D['3D'], D['4D']]))
        self.assertEqual(self.game.dealer.hand, self.h1)
        self.assertEqual(self.game.non_dealer.hand, self.h2)
        self.assertEqual(self.game.crib, self.crib)

    def test_simple_his_heels(self):
        self.game.starter = D['10S']
        self.game.reveal_starter()
        self.assertEqual(self.game.dealer.score, 0)

        self.game.starter = D['JS']
        self.game.reveal_starter()
        self.assertEqual(self.game.dealer.score, 2)

    def test_his_heels(self):
        for _ in range(5000):
            self.game.dealer.score = 0
            self.game.starter = random.choice(cribbage.Cribbage.DECK)
            self.game.reveal_starter()
            if self.game.starter.number == 'J':
                self.assertEqual(self.game.dealer.score, 2)
            else:
                self.assertEqual(self.game.dealer.score, 0)
            self.assertEqual(self.game.non_dealer.score, 0)

    def test_play(self):
        self.game.discard()
        self.game.play()
        self.assertEqual(self.game.dealer.score, 9)
        self.assertEqual(self.game.non_dealer.score, 1)

    def test_play2(self):
        self.game.dealer.hand = Hand([D['AC'], D['AS'], D['AD'], D['AH']])
        self.game.non_dealer.hand = Hand([D['KC'], D['QC'], D['JD'], D['10D']])
        self.game.play()
        self.assertEqual(self.game.dealer.score, 9)
        self.assertEqual(self.game.non_dealer.score, 1)

    def test_play3(self):
        self.game.dealer.hand = Hand([D['5C'], D['5S'], D['10C'], D['10S']])
        self.game.non_dealer.hand = Hand([D['5H'], D['5D'], D['10H'], D['10D']])
        self.game.play()
        self.assertEqual(self.game.dealer.score, 21)
        self.assertEqual(self.game.non_dealer.score, 11)

    def test_play4(self):
        self.game.dealer.hand = Hand([D['8H'], D['9D'], D['9H'], D['10D']])
        self.game.non_dealer.hand = Hand([D['7C'], D['7S'], D['8C'], D['JS']])
        self.game.play()
        self.assertEqual(self.game.dealer.score, 9)
        self.assertEqual(self.game.non_dealer.score, 1)


class TestCribbagePlayScoring(unittest.TestCase):
    def setUp(self):
        pass

    def test_fifteens1(self):
        score = scoring.score_fifteens([D['8D'], D['7S']])
        self.assertEqual(score, 2)
        score = scoring.score_fifteens([D['AD'], D['4S'], D['KS']])
        self.assertEqual(score, 2)
        score = scoring.score_fifteens([D['AD']])
        self.assertEqual(score, 0)

    def test_fifteens2(self):
        score = scoring.score_fifteens([D['AD'], D['AS'], D['AC'], D['2D'], D['9C']])
        self.assertEqual(score, 0)

        score = scoring.score_fifteens([D['AD'], D['AS'], D['AC'], D['2D'], D['JC']])
        self.assertEqual(score, 2)

        score = scoring.score_fifteens([D['2D'], D['2S'], D['8C'], D['3D'], D['KC']])
        self.assertEqual(score, 6)

        score = scoring.score_fifteens([D['4D'], D['4S'], D['5C'], D['6D'], D['6C']])
        self.assertEqual(score, 8)

        score = scoring.score_fifteens([D['3D'], D['3S'], D['3C'], D['9D'], D['10C']])
        self.assertEqual(score, 6)

        score = scoring.score_fifteens([D['8D'], D['8S'], D['8C'], D['7H'], D['7D']])
        self.assertEqual(score, 12)

        score = scoring.score_fifteens([D['5D'], D['5S'], D['5C'], D['5H'], D['JD']])
        self.assertEqual(score, 16)

    def test_pair(self):
        score = scoring.play_pairs([D['8D'], D['8S']])
        self.assertEqual(score, 2)
        score = scoring.play_pairs([D['AC'], D['AD']])
        self.assertEqual(score, 2)
        score = scoring.play_pairs([D['KD'], D['KS']])
        self.assertEqual(score, 2)
        score = scoring.play_pairs([D['JD'], D['JS']])
        self.assertEqual(score, 2)
        score = scoring.play_pairs([D['JD'], D['10S']])
        self.assertEqual(score, 0)
        score = scoring.play_pairs([D['QC'], D['KS']])
        self.assertEqual(score, 0)
        score = scoring.play_pairs([D['4D'], D['4S'], D['3C']])
        self.assertEqual(score, 0)

    def test_triple(self):
        score = scoring.play_pairs([D['3D'], D['3S'], D['3C']])
        self.assertEqual(score, 6)
        score = scoring.play_pairs([D['KD'], D['KS'], D['KC']])
        self.assertEqual(score, 6)
        score = scoring.play_pairs([D['4D'], D['3S'], D['3C']])
        self.assertEqual(score, 2)
        score = scoring.play_pairs([D['4D'], D['3S'], D['4C']])
        self.assertEqual(score, 0)

    def test_double_pair(self):
        score = scoring.play_pairs([D['3D'], D['3S'], D['3C'], D['3H']])
        self.assertEqual(score, 12)
        score = scoring.play_pairs([D['2D'], D['3S'], D['3C'], D['3H']])
        self.assertEqual(score, 6)
        score = scoring.play_pairs([D['3D'], D['2S'], D['3C'], D['3H']])
        self.assertEqual(score, 2)
        score = scoring.play_pairs([D['3D'], D['3S'], D['3C'], D['2H']])
        self.assertEqual(score, 0)

    def test_runs(self):
        score = scoring.play_runs([D['AD'], D['2S'], D['3C'], D['4H']])
        self.assertEqual(score, 4)
        score = scoring.play_runs([D['2D'], D['3S'], D['4C'], D['5H'], D['6H']])
        self.assertEqual(score, 5)
        score = scoring.play_runs([D['2D'], D['QS'], D['4C'], D['5H'], D['6H']])
        self.assertEqual(score, 3)
        score = scoring.play_runs([D['2D'], D['QS'], D['5C'], D['7H'], D['6H']])
        self.assertEqual(score, 3)
        score = scoring.play_runs([D['2D'], D['5S'], D['7C'], D['7H'], D['6H']])
        self.assertEqual(score, 0)

    def test_flush(self):
        score = scoring.play_flush([D['AH'], D['2D'], D['3D'], D['5D'], D['6D']])
        self.assertEqual(score, 4)
        score = scoring.play_flush([D['2D'], D['3D'], D['5D'], D['6C']])
        self.assertEqual(score, 0)
        score = scoring.play_flush([D['2D'], D['3D'], D['5D'], D['6D'], D['AD']])
        self.assertEqual(score, 5)

    def test_multiple_scoring(self):
        # Five card run, flush, fifteen
        score = scoring.score_play([D['AD'], D['2D'], D['3D'], D['4D'], D['5D']])
        self.assertEqual(score, 12)

        # Five card run, fifteen
        score = scoring.score_play([D['AD'], D['2D'], D['3C'], D['4D'], D['5D']])
        self.assertEqual(score, 7)

        # Fifteen, double-pair
        score = scoring.score_play([D['7S'], D['2S'], D['2C'], D['2H'], D['2D']])
        self.assertEqual(score, 14)


class TestCribbagePegging(unittest.TestCase):
    def setUp(self):
        random.seed(23)
        self.player1 = Player("Alice")
        self.player2 = Player("Bob")
        self.game = cribbage.Cribbage([self.player1, self.player2], MockEvent)
        self.game.draw()
        self.game.deal()
        #self.game.play_peg()

    def test_pegging_runs(self):
        # Scoring pegging runs is different than scoring play runs, so we'll test it here separately (same w/
        # flushes below).
        score = scoring.peg_runs([D['AS'], D['2C'], D['2H'], D['AD'], D['3S']])
        self.assertEqual(score, 12)
        score = scoring.peg_runs([D['AS'], D['2C'], D['3H'], D['4D'], D['AS']])
        self.assertEqual(score, 8)
        score = scoring.peg_runs([D['AS'], D['2C'], D['3H'], D['5D'], D['6S']])
        self.assertEqual(score, 3)
        score = scoring.peg_runs([D['AS'], D['2C'], D['3H'], D['4D'], D['5S']])
        self.assertEqual(score, 5)
        score = scoring.peg_runs([D['AS'], D['2C'], D['3H'], D['4D'], D['6S']])
        self.assertEqual(score, 4)
        score = scoring.peg_runs([D['AS'], D['2C'], D['3H'], D['2D'], D['5S']])
        self.assertEqual(score, 6)
        score = scoring.peg_runs([D['AS'], D['2C'], D['3H'], D['4D'], D['2S']])
        self.assertEqual(score, 8)
        score = scoring.peg_runs([D['AS'], D['2C'], D['2H'], D['2D'], D['3S']])
        self.assertEqual(score, 9)
        score = scoring.peg_runs([D['AS'], D['AC'], D['3H'], D['4D'], D['5S']])
        self.assertEqual(score, 3)
        score = scoring.peg_runs([D['AS'], D['2C'], D['4H'], D['5D'], D['7S']])
        self.assertEqual(score, 0)
        score = scoring.peg_runs([D['10S'], D['JC'], D['QH'], D['KD'], D['AS']])
        self.assertEqual(score, 4)
        score = scoring.peg_runs([D['10S'], D['JC'], D['QH'], D['KD'], D['QS']])
        self.assertEqual(score, 8)
        score = scoring.peg_runs([D['10S'], D['JC'], D['QH'], D['KD'], D['9S']])
        self.assertEqual(score, 5)

    def test_pegging_flush(self):
        score = scoring.peg_flush(Hand([D['6C'], D['10C'], D['5C'], D['4C']]), D['9D'])
        self.assertEqual(score, 4)
        score = scoring.peg_flush(Hand([D['6C'], D['10C'], D['5C'], D['4C']]), D['9C'])
        self.assertEqual(score, 5)
        score = scoring.peg_flush(Hand([D['6C'], D['10C'], D['5C'], D['4C']]), D['9D'], crib=True)
        self.assertEqual(score, 0)
        score = scoring.peg_flush(Hand([D['6C'], D['10C'], D['5C'], D['4C']]), D['9C'], crib=True)
        self.assertEqual(score, 5)

    def test_peg_scoring(self):
        score = scoring.score_peg(Hand([D['6C'], D['10D'], D['5H'], D['4S']]), D['5D'])
        self.assertEqual(score, 16)
        score = scoring.score_peg(Hand([D['3D'], D['4D'], D['7D'], D['8D']]), D['JC'])
        self.assertEqual(score, 8)
        score = scoring.score_peg(Hand([D['5D'], D['5H'], D['5C'], D['JS']]), D['5S'])
        self.assertEqual(score, 29)
        score = scoring.score_peg(Hand([D['5D'], D['5H'], D['5C'], D['JC']]), D['5S'])
        self.assertEqual(score, 28)
        score = scoring.score_peg(Hand([D['7D'], D['7H'], D['8S'], D['8C']]), D['9S'])
        self.assertEqual(score, 24)
        score = scoring.score_peg(Hand([D['4D'], D['4H'], D['5S'], D['6C']]), D['6S'])
        self.assertEqual(score, 24)
        score = scoring.score_peg(Hand([D['10D'], D['QH'], D['9S'], D['KC']]), D['4S'])
        self.assertEqual(score, 0)
        score = scoring.score_peg(Hand([D['3D'], D['3H'], D['3S'], D['9C']]), D['6S'])
        self.assertEqual(score, 16)
        score = scoring.score_peg(Hand([D['AD'], D['2H'], D['3S'], D['4C']]), D['5S'])
        self.assertEqual(score, 7)
        score = scoring.score_peg(Hand([D['2D'], D['3H'], D['4S'], D['4C']]), D['4H'])
        self.assertEqual(score, 17)
        score = scoring.score_peg(Hand([D['6D'], D['3H'], D['3S'], D['3C']]), D['6H'])
        self.assertEqual(score, 18)
        score = scoring.score_peg(Hand([D['5D'], D['4H'], D['4S'], D['4C']]), D['6H'])
        self.assertEqual(score, 21)
        score = scoring.score_peg(Hand([D['5D'], D['5H'], D['5S'], D['JD']]), D['JS'])
        self.assertEqual(score, 22)
        score = scoring.score_peg(Hand([D['5D'], D['5H'], D['5S'], D['4S']]), D['6S'])
        self.assertEqual(score, 23)


    #def test_pegging(self):
    #    # TODO: Work out mock event for pegging
    #    self.assertEqual(self.game.dealer.score, 2)
    #    self.assertEqual(self.game.non_dealer.score, 2)

if __name__ == '__main__':
    try:
        unittest.main()
    except Exception as e:
        print(e)

    if cover:
        tmp_path = os.path.dirname(os.path.realpath(__file__))
        cov.stop()
        cov.save()
        print ("\n\nCoverage Report:\n")
        cov.report()
        print ("HTML version: " + os.path.join(tmp_path, "tmp/coverage/index.html"))
        cov.html_report(directory='tmp/coverage')
        cov.erase()
