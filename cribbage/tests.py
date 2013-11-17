import unittest

cover = False

if cover:
    import coverage
    cov = coverage.coverage(branch = True, omit = ['tests.py', 'cribbage/__init__.py'])
    cov.start()

import os
import cribbage.cribbage as cribbage
import cribbage.scoring as scoring
from cribbage.event import MockEvent
from cribbage.player import Player
import random

HAND1 = cribbage.Hand([ cribbage.Card('3', 'D'), cribbage.Card('4', 'D'),
                          cribbage.Card('5', 'C'), cribbage.Card('6', 'H'),
                          cribbage.Card('8', 'D'), cribbage.Card('9', 'C')])

HAND2 = cribbage.Hand([ cribbage.Card('A', 'C'), cribbage.Card('2', 'C'),
                          cribbage.Card('5', 'S'), cribbage.Card('7', 'D'),
                           cribbage.Card('7', 'S'), cribbage.Card('10', 'C')])
STARTER = cribbage.Card('A', 'D')

class TestCard(unittest.TestCase):

    def setUp(self):
        self.ace_of_spades = cribbage.Card('A', 'S')
        self.two_of_spades = cribbage.Card('2', 'S')
        self.five_of_diamonds = cribbage.Card('5', 'D')
        self.five_of_hearts = cribbage.Card('5', 'H')
        self.five_of_spades = cribbage.Card('5', 'S')
        self.five_of_clubs = cribbage.Card('5', 'C')
        self.ten_of_spades = cribbage.Card('10', 'S')
        self.jack_of_spades = cribbage.Card('J', 'S')
        self.queen_of_spades = cribbage.Card('Q', 'S')
        self.king_of_spades = cribbage.Card('K', 'S')

    def test_card_ordering(self):
        # Card ordering is used for sorting cards in a hand. This is important for presenting the cards to player,
        # but it has no impact on any game logic.
        self.assertLess(self.ace_of_spades, self.two_of_spades)
        self.assertLess(self.two_of_spades, self.five_of_diamonds)

    def test_suit_ordering(self):
        self.assertLess(self.five_of_diamonds, self.five_of_hearts)
        self.assertLess(self.five_of_diamonds, self.five_of_spades)
        self.assertLess(self.five_of_diamonds, self.five_of_clubs)
        self.assertLess(self.five_of_clubs, self.five_of_hearts)
        self.assertLess(self.five_of_clubs, self.five_of_spades)
        self.assertLess(self.five_of_hearts, self.five_of_spades)

    def test_face_card_ordering(self):
        self.assertLess(self.ten_of_spades, self.jack_of_spades)
        self.assertLess(self.jack_of_spades, self.queen_of_spades)
        self.assertLess(self.queen_of_spades, self.king_of_spades)

    def test_card_values(self):
        self.assertEqual(self.ace_of_spades.value, 1)
        self.assertEqual(self.two_of_spades.value, 2)
        self.assertEqual(self.five_of_spades.value, 5)
        self.assertEqual(self.ten_of_spades.value, 10)
        self.assertEqual(self.jack_of_spades.value, 10)
        self.assertEqual(self.queen_of_spades.value, 10)
        self.assertEqual(self.king_of_spades.value, 10)

class TestHand(unittest.TestCase):

    def setUp(self):
        self.hand1 = cribbage.Hand([cribbage.Card('9', 'C'), cribbage.Card('9', 'D'), cribbage.Card('9', 'H'),
                                    cribbage.Card('A', 'S'), cribbage.Card('9', 'S'), cribbage.Card('A', 'C')])

        self.hand2 = cribbage.Hand([cribbage.Card('10', 'D'), cribbage.Card('J', 'H'), cribbage.Card('9', 'C'),
                                    cribbage.Card('K', 'S'), cribbage.Card('Q', 'S'), cribbage.Card('J', 'C')])

    def test_hand_sorting(self):
        self.assertEqual(self.hand1.hand, [cribbage.Card('A', 'C'), cribbage.Card('A', 'S'), cribbage.Card('9', 'D'), cribbage.Card('9', 'C') ,
                                    cribbage.Card('9', 'H'), cribbage.Card('9', 'S'), ])
        self.assertEqual(self.hand2.hand, [cribbage.Card('9', 'C'), cribbage.Card('10', 'D'), cribbage.Card('J', 'C'),
                                           cribbage.Card('J', 'H'), cribbage.Card('Q', 'S'), cribbage.Card('K', 'S')])

    def test_hand_length(self):
        self.assertEqual(len(self.hand1), 6)
        self.assertEqual(len(self.hand2), 6)

    def test_hand_getitem(self):
        self.assertEqual(self.hand1[0], cribbage.Card('A', 'C'))
        self.assertEqual(self.hand1[5], cribbage.Card('9', 'S'))

    def test_hand_setitem(self):
        # setitem replaces the card at the given index, and immediately re-sorts the hand. So as is seen below, setting
        # a card to particular index does not guarentee that the card will remain at that index.
        self.hand1[5] = cribbage.Card('J', 'S')
        self.assertEqual(self.hand1[5], cribbage.Card('J', 'S'))
        self.hand1[5] = cribbage.Card('3', 'S')
        self.assertEqual(self.hand1[5], cribbage.Card('9', 'H'))
        self.assertEqual(self.hand1[2], cribbage.Card('3', 'S'))

    def test_hand_discard(self):
        self.assertEqual(len(self.hand1), 6)
        discarded1 = self.hand1.discard([0, 2])
        self.assertEqual(self.hand1.hand, [cribbage.Card('A', 'S'), cribbage.Card('9', 'C'), cribbage.Card('9', 'H'),
                                      cribbage.Card('9', 'S')])
        self.assertEqual(discarded1, [cribbage.Card('A', 'C'), cribbage.Card('9', 'D') ])
        self.assertEqual(len(self.hand1), 4)

        self.assertEqual(len(self.hand2), 6)
        discarded2 = self.hand2.discard([2, 3])
        self.assertEqual(self.hand2.hand, [cribbage.Card('9', 'C'), cribbage.Card('10', 'D'), cribbage.Card('Q', 'S'),
                                      cribbage.Card('K', 'S')])
        self.assertEqual(discarded2, [cribbage.Card('J', 'C'), cribbage.Card('J', 'H') ])
        self.assertEqual(len(self.hand1), 4)

    def test_hand_play(self):
        self.assertEqual(self.hand1.played, [])
        self.assertEqual(self.hand1.unplayed, self.hand1.hand)

        self.hand1.play(0)
        self.assertEqual(self.hand1.played, [cribbage.Card('A', 'C')])
        self.assertEqual(self.hand1.unplayed, [cribbage.Card('A', 'S'), cribbage.Card('9', 'D'), cribbage.Card('9', 'C'),
                                               cribbage.Card('9', 'H'), cribbage.Card('9', 'S')])

        self.hand1.play(4)
        self.assertEqual(self.hand1.played, [cribbage.Card('A', 'C'), cribbage.Card('9', 'S')])
        self.assertEqual(self.hand1.unplayed, [cribbage.Card('A', 'S'), cribbage.Card('9', 'D'),
                                               cribbage.Card('9', 'C'), cribbage.Card('9', 'H')])

        self.hand1.play(2)
        self.assertEqual(self.hand1.played, [cribbage.Card('A', 'C'), cribbage.Card('9', 'C'), cribbage.Card('9', 'S')])
        self.assertEqual(self.hand1.unplayed, [cribbage.Card('A', 'S'), cribbage.Card('9', 'D'), cribbage.Card('9', 'H')])

        self.hand1.play(0)
        self.assertEqual(self.hand1.played, [cribbage.Card('A', 'C'), cribbage.Card('A', 'S'),
                                             cribbage.Card('9', 'C'), cribbage.Card('9', 'S')])
        self.assertEqual(self.hand1.unplayed, [cribbage.Card('9', 'D'), cribbage.Card('9', 'H')])

        self.hand1.play(0)
        self.assertEqual(self.hand1.played, [cribbage.Card('A', 'C'), cribbage.Card('A', 'S'), cribbage.Card('9', 'D'),
                                             cribbage.Card('9', 'C'), cribbage.Card('9', 'S')])
        self.assertEqual(self.hand1.unplayed, [cribbage.Card('9', 'H')])

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
        self.player1.add_score(10)
        self.assertEqual(self.player1.score, 10)
        self.player1.add_score(10)
        self.assertEqual(self.player1.score, 20)
        self.player1.add_score(10)
        self.assertEqual(self.player1.score, 30)
        self.player2.add_score(40)
        self.assertEqual(self.player2.score, 40)
        self.player1.add_score(50)
        self.assertEqual(self.player1.score, 80)
        self.player2.add_score(40)
        self.assertEqual(self.player2.score, 80)

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
        self.assertEqual(self.game.current_player,self.player1)

    def test_switch_current_player(self):
        self.assertEqual(self.game.current_player,self.player1)
        self.game.switch_current_player()
        self.assertEqual(self.game.current_player,self.player2)

    def test_switch_dealer(self):
        self.assertEqual(self.game.dealer, self.player2)
        self.assertEqual(self.game.non_dealer, self.player1)
        self.game.switch_dealer()
        self.assertEqual(self.game.dealer, self.player1)
        self.assertEqual(self.game.non_dealer, self.player2)

    def test_deal(self):
        self.assertEqual(len(self.game.dealer.hand), 6)
        self.assertIsInstance(self.game.dealer.hand, cribbage.Hand)
        self.assertEqual(len(self.game.non_dealer.hand), 6)
        self.assertIsInstance(self.game.non_dealer.hand, cribbage.Hand)
        self.assertIsInstance(self.game.starter, cribbage.Card)

        self.assertEqual(self.game.dealer.hand, HAND1)
        self.assertEqual(self.game.non_dealer.hand, HAND2)
        self.assertEqual(self.game.starter, STARTER)

class TestCribbageDiscardPlay(unittest.TestCase):

    def setUp(self):
        random.seed(23)
        self.player1 = Player("Alice")
        self.player2 = Player("Bob")
        self.game = cribbage.Cribbage([self.player1, self.player2], MockEvent)
        self.game.draw()
        self.game.deal()

        self.H1 = cribbage.Hand([ cribbage.Card('5', 'C'), cribbage.Card('6', 'H'),
                                  cribbage.Card('8', 'D'), cribbage.Card('9', 'C')])

        self.H2 = cribbage.Hand([  cribbage.Card('5', 'S'), cribbage.Card('7', 'D'),
                                   cribbage.Card('7', 'S'), cribbage.Card('10', 'C')])

        self.crib = cribbage.Hand([cribbage.Card('A','C'), cribbage.Card('2','C'),
                                   cribbage.Card('3','D'), cribbage.Card('4','D')])

    def test_discard(self):
        self.assertEqual(self.game.crib, [])
        self.game.discard()
        self.assertEqual(self.game.crib, cribbage.Hand([cribbage.Card('A', 'C'), cribbage.Card('2', 'C'),
                                                        cribbage.Card('3', 'D'), cribbage.Card('4', 'D')]))
        self.assertEqual(self.game.dealer.hand, self.H1)
        self.assertEqual(self.game.non_dealer.hand, self.H2)
        self.assertEqual(self.game.crib, self.crib)

    def test_his_heels(self):
        self.game.starter = cribbage.Card('10', 'S')
        self.game.reveal_starter()
        self.assertEqual(self.game.dealer.score, 0)

        self.game.starter = cribbage.Card('J', 'S')
        self.game.reveal_starter()
        self.assertEqual(self.game.dealer.score, 2)

    def test_play(self):
        self.game.discard()
        self.game.play()
        self.assertEqual(self.game.dealer.score, 9)
        self.assertEqual(self.game.non_dealer.score, 1)

    def test_play2(self):
        self.game.dealer.hand = cribbage.Hand([cribbage.Card('A', 'C'), cribbage.Card('A', 'S'),
                                               cribbage.Card('A', 'D'), cribbage.Card('A', 'H')])
        self.game.non_dealer.hand = cribbage.Hand([cribbage.Card('K', 'C'), cribbage.Card('Q', 'C'),
                                               cribbage.Card('J', 'D'), cribbage.Card('10', 'D')])
        self.game.play()
        self.assertEqual(self.game.dealer.score, 9)
        self.assertEqual(self.game.non_dealer.score, 1)

    def test_play3(self):
        self.game.dealer.hand = cribbage.Hand([cribbage.Card('5', 'C'), cribbage.Card('5', 'S'),
                                               cribbage.Card('10', 'C'), cribbage.Card('10', 'S')])
        self.game.non_dealer.hand = cribbage.Hand([cribbage.Card('5', 'H'), cribbage.Card('5', 'D'),
                                               cribbage.Card('10', 'H'), cribbage.Card('10', 'D')])
        self.game.play()
        self.assertEqual(self.game.dealer.score, 21)
        self.assertEqual(self.game.non_dealer.score, 11)

    def test_play4(self):
        self.game.dealer.hand = cribbage.Hand([cribbage.Card('8', 'H'), cribbage.Card('9', 'D'),
                                               cribbage.Card('9', 'H'), cribbage.Card('10', 'D')])
        self.game.non_dealer.hand = cribbage.Hand([cribbage.Card('7', 'C'), cribbage.Card('7', 'S'),
                                                   cribbage.Card('8', 'C'), cribbage.Card('J', 'S')])
        self.game.play()
        self.assertEqual(self.game.dealer.score, 9)
        self.assertEqual(self.game.non_dealer.score, 1)


class TestCribbageScoring(unittest.TestCase):

    def setUp(self):
        random.seed(23)
        self.player1 = Player("Alice")
        self.player2 = Player("Bob")
        self.game = cribbage.Cribbage([self.player1, self.player2], MockEvent)
        self.game.draw()
        self.game.deal()

    def test_fifteen(self):
        score = scoring.score_play([cribbage.Card('8', 'D'), cribbage.Card('7', 'S')])
        self.assertEqual(score, 2)
        score = scoring.score_play([cribbage.Card('A', 'D'), cribbage.Card('4', 'S'), cribbage.Card('K', 'S')])
        self.assertEqual(score, 2)
        score = scoring.score_play([cribbage.Card('A', 'D')])
        self.assertEqual(score, 0)

    def test_pair(self):
        score = scoring.score_play([cribbage.Card('8', 'D'), cribbage.Card('8', 'S')])
        self.assertEqual(score, 2)
        score = scoring.score_play([cribbage.Card('A', 'C'), cribbage.Card('A', 'D')])
        self.assertEqual(score, 2)
        score = scoring.score_play([cribbage.Card('K', 'D'), cribbage.Card('K', 'S')])
        self.assertEqual(score, 2)
        score = scoring.score_play([cribbage.Card('J', 'D'), cribbage.Card('J', 'S')])
        self.assertEqual(score, 2)
        score = scoring.score_play([cribbage.Card('J', 'D'), cribbage.Card('10', 'S')])
        self.assertEqual(score, 0)
        score = scoring.score_play([cribbage.Card('Q', 'C'), cribbage.Card('K', 'S')])
        self.assertEqual(score, 0)
        score = scoring.score_play([cribbage.Card('4', 'D'), cribbage.Card('4', 'S'), cribbage.Card('3', 'C')])
        self.assertEqual(score, 0)

    def test_triple(self):
        score = scoring.score_play([cribbage.Card('3', 'D'), cribbage.Card('3', 'S'), cribbage.Card('3', 'C')])
        self.assertEqual(score, 6)
        score = scoring.score_play([cribbage.Card('K', 'D'), cribbage.Card('K', 'S'), cribbage.Card('K', 'C')])
        self.assertEqual(score, 6)
        score = scoring.score_play([cribbage.Card('4', 'D'), cribbage.Card('3', 'S'), cribbage.Card('3', 'C')])
        self.assertEqual(score, 2)
        score = scoring.score_play([cribbage.Card('4', 'D'), cribbage.Card('3', 'S'), cribbage.Card('4', 'C')])
        self.assertEqual(score, 0)

    def test_double_pair(self):
        score = scoring.score_play([cribbage.Card('3', 'D'), cribbage.Card('3', 'S'),
                                       cribbage.Card('3', 'C'), cribbage.Card('3', 'H')])
        self.assertEqual(score, 12)
        score = scoring.score_play([cribbage.Card('2', 'D'), cribbage.Card('3', 'S'),
                                       cribbage.Card('3', 'C'), cribbage.Card('3', 'H')])
        self.assertEqual(score, 6)
        score = scoring.score_play([cribbage.Card('3', 'D'), cribbage.Card('2', 'S'),
                                       cribbage.Card('3', 'C'), cribbage.Card('3', 'H')])
        self.assertEqual(score, 2)
        score = scoring.score_play([cribbage.Card('3', 'D'), cribbage.Card('3', 'S'),
                                       cribbage.Card('3', 'C'), cribbage.Card('2', 'H')])
        self.assertEqual(score, 0)

    def test_runs(self):
        score = scoring.score_play([cribbage.Card('A', 'D'), cribbage.Card('2', 'S'),
                                       cribbage.Card('3', 'C'), cribbage.Card('4', 'H')])
        self.assertEqual(score, 4)
        score = scoring.score_play([cribbage.Card('2', 'D'), cribbage.Card('3', 'S'),
                                       cribbage.Card('4', 'C'), cribbage.Card('5', 'H'),
                                       cribbage.Card('6', 'H'),])
        self.assertEqual(score, 5)
        score = scoring.score_play([cribbage.Card('2', 'D'), cribbage.Card('Q', 'S'),
                                       cribbage.Card('4', 'C'), cribbage.Card('5', 'H'),
                                       cribbage.Card('6', 'H'),])
        self.assertEqual(score, 3)
        score = scoring.score_play([cribbage.Card('2', 'D'), cribbage.Card('Q', 'S'),
                                       cribbage.Card('5', 'C'), cribbage.Card('7', 'H'),
                                       cribbage.Card('6', 'H'),])
        self.assertEqual(score, 3)
        score = scoring.score_play([cribbage.Card('2', 'D'), cribbage.Card('5', 'S'),
                                       cribbage.Card('7', 'C'), cribbage.Card('7', 'H'),
                                       cribbage.Card('6', 'H'),])
        self.assertEqual(score, 0)

    def test_flush(self):
        score = scoring.score_play([cribbage.Card('A', 'H'), cribbage.Card('2', 'D'),
                                      cribbage.Card('3', 'D'), cribbage.Card('5', 'D'),
                                      cribbage.Card('6', 'D')])
        self.assertEqual(score, 4)
        score = scoring.score_play([cribbage.Card('2', 'D'), cribbage.Card('3', 'D'),
                                       cribbage.Card('5', 'D'), cribbage.Card('6', 'C')])
        self.assertEqual(score, 0)
        score = scoring.score_play([cribbage.Card('2', 'D'), cribbage.Card('3', 'D'),
                                       cribbage.Card('5', 'D'), cribbage.Card('6', 'D'),
                                       cribbage.Card('A', 'D')])
        self.assertEqual(score, 5)

    def test_multiple_scoreg(self):
        # Five card run, flush, fifteen
        score = scoring.score_play([cribbage.Card('A', 'D'), cribbage.Card('2', 'D'),
                                       cribbage.Card('3', 'D'), cribbage.Card('4', 'D'),
                                       cribbage.Card('5', 'D')])
        self.assertEqual(score, 12)

        # Five card run, fifteen
        score = scoring.score_play([cribbage.Card('A', 'D'), cribbage.Card('2', 'D'),
                                       cribbage.Card('3', 'C'), cribbage.Card('4', 'D'),
                                       cribbage.Card('5', 'D')])
        self.assertEqual(score, 7)

        # Fifteen, double-pair
        score = scoring.score_play([cribbage.Card('7', 'S'), cribbage.Card('2', 'S'), cribbage.Card('2', 'C'),
                                       cribbage.Card('2', 'H'), cribbage.Card('2', 'D')])
        self.assertEqual(score, 14)



if __name__ == '__main__':
    try:
        unittest.main()
    except:
        pass

    if cover:
        tmp_path = os.path.dirname(os.path.realpath(__file__))
        cov.stop()
        cov.save()
        print ("\n\nCoverage Report:\n")
        cov.report()
        print ("HTML version: " + os.path.join(tmp_path, "tmp/coverage/index.html"))
        cov.html_report(directory = 'tmp/coverage')
        cov.erase()
