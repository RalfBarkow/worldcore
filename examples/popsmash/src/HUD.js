import { Widget, BoxWidget, TextFieldWidget, ButtonWidget, HorizontalWidget, VerticalWidget, TextWidget, ToggleWidget, ToggleSet, ImageWidget } from "@croquet/worldcore";
import { Nickname } from "./Names";
import { MyPlayerPawn } from "./Player";
import { Question } from "./Questions";
import { CharacterName} from "./Characters";
import { RoundPoints } from "./Points";
import check from "../assets/check.png";
import poppins from "../assets/Poppins-Regular.otf";
import logo from "../assets/popsmashlogov1.png";

const bgColor = [0.5, 0.75, 10.75];
let playerName;

export class HUD extends BoxWidget {
    constructor(...args) {
        super(...args);
        this.set({autoSize: [1,1], color: bgColor});
        this.joinScreen = new JoinScreen(this, {autoSize: [1,1]});
        this.gameScreen = new GameScreen(this, {autoSize: [1,1], visible: false});
        this.subscribe("hud", "joinGame", this.joinGame);
    }

    joinGame() {
        this.joinScreen.hide();
        this.gameScreen.show();
        this.gameScreen.refresh();
    }


}

//------------------------------------------------------------------------------------------
//-- JoinScreen ----------------------------------------------------------------------------
//------------------------------------------------------------------------------------------

class JoinScreen extends Widget {

    constructor(...args) {
        super(...args);

        this.background = new BoxWidget(this, {autoSize: [1,1], color: bgColor});

        this.title = new TitlePanel(this.background, {autoSize:[1,0], local: [0,150]});

        this.entry = new BoxWidget(this.background, {color: bgColor, autoSize: [0, 0], anchor: [0.5,0.5], pivot: [0.5, 0.5], size:[600,45]});
        // this.label = new TextWidget(this.entry, {local: [0, 0], size:[200,40], alignX: 'left', alignY: 'bottom', text:'Enter Player Name', point: 14, url: poppins});
        this.entryLayout = new HorizontalWidget(this.entry, {autoSize: [1, 1], margin: 5});

        this.nameEntry = new TextFieldWidget(this.entryLayout, {autoSize: [1,0], anchor:[0,1], pivot: [0,1], size:[0,45]});
        this.nameEntry.text.set({text: playerName || Nickname(), url: poppins});
        this.nameEntry.onEnter = () => this.joinGame();
        this.entryLayout.addSlot(this.nameEntry);

        this.enterButton = new ButtonWidget(this.entryLayout, {autoSize: [1,0], anchor:[0,1], pivot: [0,1], size:[0,45], width: 100});
        this.enterButton.label.set({text: "Join", url: poppins});
        this.enterButton.onClick = () => this.joinGame();
        this.entryLayout.addSlot(this.enterButton);
    }

    joinGame() {
        const name = this.nameEntry.text.text.slice(0,32);
        playerName = name;
        MyPlayerPawn().setName(name);
        this.publish("hud", "joinGame");
    }

}

//------------------------------------------------------------------------------------------
//-- GameScreen ----------------------------------------------------------------------------
//------------------------------------------------------------------------------------------

export class GameScreen extends Widget {
    constructor(...args) {
        super(...args);

        this.lobbyPanel = new LobbyPanel(this, {autoSize:[1,1], visible: false});
        this.seedPanel = new SeedPanel(this, {autoSize:[1,1], visible: false});
        this.debatePanel = new DebatePanel(this, {autoSize:[1,1], visible: false});
        this.votePanel = new VotePanel(this, {autoSize:[1,1], visible: false})
        this.winPanel = new WinPanel(this, {autoSize:[1,1], visible: false});

        // this.refresh();

        this.subscribe("gm", "mode", this.refresh);
    }

    refresh() {
        const gm = this.wellKnownModel("GameMaster");
        const mode = gm.mode;
        if (this.activePanel) this.activePanel.hide();
        switch (mode) {
            case 'lobby':
                this.activePanel = this.lobbyPanel;
                break;
            case 'seed':
                this.activePanel = this.seedPanel;
                break;
            case 'debate':
                this.activePanel = this.debatePanel;
                break;
            case 'vote':
                this.activePanel = this.votePanel;
                break;
            case 'win':
                this.activePanel = this.winPanel;
                break;
            default:
        }
        if (this.activePanel) {
            this.activePanel.show();
            this.activePanel.refresh();
        }
    }

}

//------------------------------------------------------------------------------------------
//-- TitlePanel ----------------------------------------------------------------------------
//------------------------------------------------------------------------------------------

class TitlePanel extends BoxWidget {
    constructor(...args) {
        super(...args);
        this.set({color: bgColor});

        // const t = new TextWidget(this, {autoSize: [1,1], local:[0,50], point: 48, style: 'bold', text: "Pop Smash!", url: poppins});
        // t.setFontByURL(poppins);
        const ii = new ImageWidget(this, {anchor: [0.5, 0.5], pivot: [0.5, 0.5], scale: 0.3, size: [1498,962], local:[0,0], url: logo});
    }
}

//------------------------------------------------------------------------------------------
//-- LobbyPanel ----------------------------------------------------------------------------
//------------------------------------------------------------------------------------------
class LobbyPanel extends BoxWidget {
    constructor(...args) {
        super(...args);
        this.set({color: bgColor});




        const vertical = new VerticalWidget(this, {autoSize: [1,1]});

        const title = new TitlePanel(null, {height: 400});
        vertical.addSlot(title);

        const infoText = `Sixteen pop culture icons face-off in crazy 1-on-1 battles. Vote to determine who wins each match-up. Your goal is to predict who will be on top of the heap when the dust clears!\n\n(Share the unique URL for this page to allow others to join!)`;

        const box = new BoxWidget(null, {color: bgColor, height: 250})
        const info = new TextWidget(box, {autoSize: [1,1], border: [20,20,20,20], point: 28, alignX: 'left', alignY: 'top', text: infoText, url: poppins});
        vertical.addSlot(box);

        const horizontal = new HorizontalWidget(this, {autoSize: [1,1], border: [20,20,20,20], margin: 20});
        vertical.addSlot(horizontal);

        this.rankList = new RankList(null);
        horizontal.addSlot(this.rankList);

        const buttonPanel = new VerticalWidget(null, {width: 250, margin: 20});
        horizontal.addSlot(buttonPanel);

        const spacer = new Widget(null);


        const startSlot = new Widget(null, {height: 50});
        const start = new ButtonWidget(startSlot, {autoSize: [1,1]} );
        start.label.set({text: "Start Game", url: poppins});
        start.onClick = () => this.publish("hud", "startGame");
        buttonPanel.addSlot(startSlot);

        buttonPanel.addSlot(spacer);

        const resetSlot = new Widget(null, {height: 50});
        const reset = new ButtonWidget(resetSlot, {autoSize: [1,1]} );
        reset.label.set({text: "Reset Scores", url: poppins});
        reset.onClick = () => this.publish("hud", "resetScores");
        buttonPanel.addSlot(resetSlot);


    }

    refresh() {
        this.markCanvasChanged();
        // this.rankList.refresh();
    }
}

//------------------------------------------------------------------------------------------
//-- RankList ------------------------------------------------------------------------------
//------------------------------------------------------------------------------------------

class RankList extends BoxWidget {
    constructor(...args) {
        super(...args);

        this.set({color: [0.9,0.9,0.9]});
        this.layout = new VerticalWidget(this, {autoSize: [1,1], border: [5,5,5,5]});

        this.subscribe("playerManager", "listChanged", this.refresh);
        this.subscribe("playerManager", "playerChanged", this.refresh);
    }

    refresh() {
        this.markCanvasChanged();
        const players = this.wellKnownModel("PlayerManager").players;

        this.layout.destroyAllSlots();

        const ranked = [];


        players.forEach(player => {
            const me = MyPlayerPawn();
            let self = false;
            if (me) self = me.actor === player;
            ranked.push({name: player.name, score: player.score, self});
        });

        ranked.sort((a,b) => b.score - a.score);

        let rankNumber = 0;
        let previousScore = -1;

        ranked.forEach(player => {

            const h = new HorizontalWidget(null, {autoSize: [1,1], height: 30});
            this.layout.addSlot(h);

            if (player.score !== previousScore) {
                rankNumber++;
                previousScore = player.score;
            }

            const rank = new TextWidget(null, {autoSize: [1,1], alignX: 'left', point: 18, text: "" + rankNumber, width: 20, url: poppins});
            const name = new TextWidget(null, {autoSize: [1,1], alignX: 'left', point: 18, text: player.name || "...Joining", url: poppins});
            const score = new TextWidget(null, {autoSize: [1,1], alignX: 'right', point: 18, text: "" + player.score, width: 20, url: poppins});

            if (!player.name) name.set({style: 'italic'});
            if (player.self) name.set({style: 'bold'});

            h.addSlot(rank);
            h.addSlot(name);
            h.addSlot(score);

        });


    }
}

//------------------------------------------------------------------------------------------
//-- SeedPanel ----------------------------------------------------------------------------
//------------------------------------------------------------------------------------------

class SeedPanel extends BoxWidget {
    constructor(...args) {
        super(...args);
        this.set({color: [bgColor]});

        this.vertical = new VerticalWidget(this, {autoSize: [1,1]});

        this.questionPanel = new QuestionPanel(null, {autoSize: [1,0], height: 100});
        this.vertical.addSlot(this.questionPanel);

        this.seedGrid = new SeedGrid(null, {autoSize: [1,0], height: 600});
        this.vertical.addSlot(this.seedGrid);

        this.horizontal = new HorizontalWidget(null, {autoSize: [1,0], border: [10,10,10,10], margin: 10});
        this.vertical.addSlot(this.horizontal);

        this.leftVertical = new VerticalWidget(null, {autoSize: [1,1], margin: 10});
        this.horizontal.addSlot(this.leftVertical);

        this.pickPanel = new PickPanel(null, {autoSize: [1,1], height: 200});
        this.leftVertical.addSlot(this.pickPanel);

        this.spacer = new Widget(null);
        this.leftVertical.addSlot(this.spacer);

        this.statusPanel = new StatusPanel(null, {autoSize: [1,1], height: 200});
        this.leftVertical.addSlot(this.statusPanel);

        this.rankList = new RankList(null, {autoSize: [1,1]});
        this.horizontal.addSlot(this.rankList);



    }

    refresh() {
        this.questionPanel.refresh();
        this.seedGrid.refresh();
        this.statusPanel.refresh();
        this.pickPanel.refresh();
        this.rankList.refresh();
    }
}

//------------------------------------------------------------------------------------------
//-- QuestionPanel -------------------------------------------------------------------------
//------------------------------------------------------------------------------------------

class QuestionPanel extends BoxWidget {
    constructor(...args) {
        super(...args);
        this.set({color:[0.9,0.9,0.9]});
        this.textBox = new TextWidget(this, {autoSize: [1,1], style: 'italic', url: poppins, point: 24});
    }

    refresh() {
        const gm = this.wellKnownModel('GameMaster');
        this.textBox.setText(Question(gm.question));
    }
}

//------------------------------------------------------------------------------------------
//-- PickPanel -----------------------------------------------------------------------------
//------------------------------------------------------------------------------------------

class PickPanel extends BoxWidget {
    constructor(...args) {
        super(...args);
        this.set({color:[0.9,0.9,0.9]});
        this.vertical = new VerticalWidget(this, {autoSize: [1,1], border: [5,5,5,5]});

        this.entry1 = new HorizontalWidget(this, {autoSize: [1,1]});
        this.rank1 = new TextWidget(this, {autoSize: [1,1], point: 24, alignX: 'left', color: [1,0,0], url: poppins, text: "#1", width: 50});
        this.name1 = new TextWidget(this, {border: [5,5,5,5], autoSize: [1,1], point: 24, alignX: 'left', color: [1,0,0], url: poppins});
        this.points1 = new TextWidget(this, {autoSize: [1,1], point: 24, alignX: 'right', color: [1,0,0], url: poppins, text: "1000", width: 50});
        this.entry1.addSlot(this.rank1);
        this.entry1.addSlot(this.name1);
        this.entry1.addSlot(this.points1);

        this.entry2 = new HorizontalWidget(this, {autoSize: [1,1]});
        this.rank2 = new TextWidget(this, {autoSize: [1,1], point: 24, alignX: 'left', color: [0,0.5,0], url: poppins, text: "#2", width: 50});
        this.name2 = new TextWidget(this, {border: [5,5,5,5], autoSize: [1,1], point: 24, alignX: 'left', color: [0,0.5,0], url: poppins});
        this.points2 = new TextWidget(this, {autoSize: [1,1], point: 24, alignX: 'right', color: [0,0.5,0], url: poppins, text: "1000", width: 50});
        this.entry2.addSlot(this.rank2);
        this.entry2.addSlot(this.name2);
        this.entry2.addSlot(this.points2);

        this.entry3 = new HorizontalWidget(this, {autoSize: [1,1]});
        this.rank3 = new TextWidget(this, {autoSize: [1,1], point: 24, alignX: 'left', color: [0.1,0.3,0.8], url: poppins, text: "#3", width: 50});
        this.name3 = new TextWidget(this, {border: [5,5,5,5], autoSize: [1,1], point: 24, alignX: 'left', color: [0.1,0.3,0.8], url: poppins});
        this.points3 = new TextWidget(this, {autoSize: [1,1], point: 24, alignX: 'right', color: [0.1,0.3,0.8], url: poppins, text: "1000", width: 50});
        this.entry3.addSlot(this.rank3);
        this.entry3.addSlot(this.name3);
        this.entry3.addSlot(this.points3);

        this.vertical.addSlot(this.entry1);
        this.vertical.addSlot(this.entry2);
        this.vertical.addSlot(this.entry3);

        this.subscribe("playerManager", "playerChanged", this.refresh);
    }

    refresh() {
        if (!MyPlayerPawn()) {
            console.warn("No player pawn in pick panel!");
            return;
        }
        const picks = MyPlayerPawn().actor.picks;
        const points = MyPlayerPawn().actor.points;
        let name1 = "???";
        let name2 = "???";
        let name3 = "???";
        if (picks[0] >= 0) name1 = CharacterName(picks[0]);
        if (picks[1] >= 0) name2 = CharacterName(picks[1]);
        if (picks[2] >= 0) name3 = CharacterName(picks[2]);
        this.name1.setText(name1);
        this.name2.setText(name2);
        this.name3.setText(name3);
        this.points1.setText("" + points[0]);
        this.points2.setText("" + points[1]);
        this.points3.setText("" + points[2]);
    }
}

//------------------------------------------------------------------------------------------
//-- Status Panel -------------------------------------------------------------------------
//------------------------------------------------------------------------------------------

class StatusPanel extends BoxWidget {
    constructor(...args) {
        super(...args);

        this.set({color:[0.9,0.9,0.9]});

        const vertical = new VerticalWidget(this, {autoSize: [1,1], border: [5,5,5,5]});

        const hintSlot = new BoxWidget(null, {color:[0.9,0.9,0.9], height: 40});
        this.hint = new TextWidget(hintSlot, {autoSize: [1,1], point: 24, style: 'italic', text: "Hint!", alignX: "center", alignY: "middle", url: poppins});
        vertical.addSlot(hintSlot);

        const voterSlot = new BoxWidget(null, {color:[0.9,0.9,0.9]});
        this.voters = new TextWidget(voterSlot, {autoSize: [1,1], point: 64, text: "3/4", alignX: "center", alignY: "middle", url: poppins});
        vertical.addSlot(voterSlot);

        this.subscribe("playerManager", "playerChanged", this.refreshVoters);
        this.subscribe("playerManager", "listChanged", this.refreshVoters);
        this.subscribe("gm", "mode", this.refreshHint);
        this.subscribe("gm", "timer", this.refreshVoters);
    }

    refresh() {
        this.refreshHint();
        this.refreshVoters();
    }

    refreshVoters() {
        const pm = this.wellKnownModel('PlayerManager');
        const gm = this.wellKnownModel('GameMaster');

        const voters = pm.joinedCount;
        let voted = 0;
        switch (gm.mode) {
            case 'seed':
                voted = pm.pickedCount;
                break;
            case 'vote':
                voted = pm.votedCount;
                break;
            default:
        }
        if (gm.inCountdown) {
            this.voters.set({text: "" + gm.timer, color: [1,0,0]});
        } else {
            this.voters.set({text: voted + "/" + voters, color: [0,0,0]});
        }

    }

    refreshHint() {
        const gm = this.wellKnownModel('GameMaster');
        const mode = gm.mode;
        const round = gm.match + 1;
        switch (mode) {
            case 'seed':
                // this.hint.setText("Predict the top three!");
                this.hint.setText("Predict the top three!");
                break;
            case 'debate':
                // this.hint.setText("Discuss who should win the match-up!");
                this.hint.setText("Round " + round);
                break;
            case 'vote':
                // this.hint.setText("Vote for your personal pick!");
                this.hint.setText("Vote!");
                break;
            case 'win':
                // this.hint.setText("Score points for correct predictions!");
                this.hint.setText("Score!");
                break;
            case 'finale':
                // this.hint.setText("Score!");
                this.hint.setText("Victory!");
                break;
            default:
        }
    }
}

//------------------------------------------------------------------------------------------
//-- SeedGrid ------------------------------------------------------------------------------
//------------------------------------------------------------------------------------------

class SeedGrid extends Widget {

    constructor(...args) {
        super(...args);

        this.buttons = [];
        for ( let i = 0; i < 8; i++) {
            this.buttons[i] = new SeedButton(this, {anchor:[0.5,0.5], pivot:[1,0.5], local: [0,(i-3.5)*70]});
            this.buttons[i].button.onClick = () => this.pick(i);
        }

        for ( let i = 0; i < 8; i++) {
            const j = i + 8;
            this.buttons[j] = new SeedButton(this, {anchor:[0.5,0.5], pivot:[0,0.5], local: [0,(i-3.5)*70]});
            this.buttons[j].button.onClick = () => this.pick(j);
        }

    }

    refresh() {
        const gm = this.wellKnownModel('GameMaster');
        for (let i = 0; i < 16; i++) {
            this.buttons[i].button.label.setText(CharacterName(gm.seed[i]));
        }

        this.pick1 = -1;
        this.pick2 = -1;
        this.pick3 = -1;

        this.refreshTags();
    }

    pick(n) {
        if (this.pick1 === n) {
            this.pick1 = -1;
        } else if (this.pick1 === -1) {
            if (this.pick2 === n) this.pick2 = -1;
            if (this.pick3 === n) this.pick3 = -1;
            this.pick1 = n;
        } else if (this.pick2 === n) {
            this.pick2 = -1;
        } else if (this.pick2 === -1) {
            if (this.pick3 === n) this.pick3 = -1;
            this.pick2 = n;
        } else if (this.pick3 === n) {
            this.pick3 = -1;
        } else if (this.pick3 === -1) {
            this.pick3 = n;
        }
        this.refreshTags();
        this.publishPicks();
    }

    publishPicks() {
        const gm = this.wellKnownModel("GameMaster");
        const picks = [-1, -1, -1];
        if (this.pick1 !== -1) picks[0] = gm.seed[this.pick1];
        if (this.pick2 !== -1) picks[1] = gm.seed[this.pick2];
        if (this.pick3 !== -1) picks[2] = gm.seed[this.pick3];
        MyPlayerPawn().setPicks(picks);
    }

    refreshTags() {
        this.buttons.forEach(button => button.setRank(0));
        if (this.pick1 !== -1 && this.pick2 !== -1 && this.pick3 !== -1 ) {
            this.buttons.forEach(button => button.button.disable());
        }
        if (this.pick1 !== -1) this.buttons[this.pick1].setRank(1);
        if (this.pick2 !== -1) this.buttons[this.pick2].setRank(2);
        if (this.pick3 !== -1) this.buttons[this.pick3].setRank(3);
    }

}

//------------------------------------------------------------------------------------------
//-- SeedButton ----------------------------------------------------------------------------
//------------------------------------------------------------------------------------------

class SeedButton extends Widget {
    constructor(...args) {
        super(...args);

        this.set({size:[300,70]});
        this.frame = new BoxWidget(this, {autoSize:[1,1], color: bgColor, visible: true});
        this.button = new ButtonWidget(this.frame, {autoSize:[1,1], border: [5,5,5,5]});
        this.button.label.set({point: 24, border: [5,5,5,5], wrap: true, url: poppins});
    }

    setRank(n) {
        this.button.enable();
        switch (n) {
            case 0:
                this.frame.set({color:bgColor});
                break;
            case 1:
                this.frame.set({color:[1,0,0]});
                break;
            case 2:
                this.frame.set({color:[0,1,0]});
                break;
            case 3:
                this.frame.set({color:[0.3,0.5,1]});
                break;
            default:
        }
    }

}

// class SeedButton2 extends Widget {
//     constructor(...args) {
//         super(...args);

//         this.set({size:[250,50]});
//         this.tab = new BoxWidget(this, {size:[50,50], color: [1,0,0], visible: false});
//         this.label = new TextWidget(this.tab, {autoSize:[1,1], text:"1"});
//         this.button = new ButtonWidget(this, {size:[200,50]});
//         this.button.label.set({point: 20, wrap: true});
//     }

//     setRank(n) {
//         this.button.enable();
//         switch (n) {
//             case 0:
//                 this.tab.set({color:[1,0,0], visible: false});
//                 this.label.setText("0");
//                 break;
//             case 1:
//                 this.tab.set({color:[1,0,0], visible: true});
//                 this.label.setText("1");
//                 break;
//             case 2:
//                 this.tab.set({color:[0,1,0], visible: true});
//                 this.label.setText("2");
//                 break;
//             case 3:
//                 this.tab.set({color:[0.3,0.5,1], visible: true});
//                 this.label.setText("3");
//                 break;
//             default:
//         }
//     }

// }

// class LeftSeedButton extends SeedButton {
//     constructor(...args) {
//         super(...args);

//         this.tab.set({anchor:[0,0], pivot:[0,0]});
//         this.button.set({anchor:[1,0], pivot:[1,0]});
//     }

// }

// class RightSeedButton extends SeedButton {
//     constructor(...args) {
//         super(...args);

//         this.tab.set({anchor:[1,0], pivot:[1,0]});
//         this.button.set({anchor:[0,0], pivot:[0,0]});

//     }
// }

//------------------------------------------------------------------------------------------
//-- DebatePanel ---------------------------------------------------------------------------
//------------------------------------------------------------------------------------------

class DebatePanel extends BoxWidget {
    constructor(...args) {
        super(...args);
        this.set({color: bgColor});

        this.vertical = new VerticalWidget(this, {autoSize: [1,1]});

        this.questionPanel = new QuestionPanel(null, {autoSize: [1,0], height: 100});
        this.vertical.addSlot(this.questionPanel);

        const matchSlot = new Widget(null,{height: 600});
        this.matchDisplay = new MatchDisplay(matchSlot, {autoSize: [1,1]});
        this.vertical.addSlot(matchSlot);

        this.horizontal = new HorizontalWidget(null, {autoSize: [1,0], border: [10,10,10,10], margin: 10});
        this.vertical.addSlot(this.horizontal);

        this.leftVertical = new VerticalWidget(null, {autoSize: [1,1], margin: 10});
        this.horizontal.addSlot(this.leftVertical);

        this.pickPanel = new PickPanel(null, {autoSize: [1,1], height: 200});
        this.leftVertical.addSlot(this.pickPanel);

        this.spacer = new Widget(null);
        this.leftVertical.addSlot(this.spacer);

        this.statusPanel = new StatusPanel(null, {autoSize: [1,1], height: 200});
        this.leftVertical.addSlot(this.statusPanel);

        this.rankList = new RankList(null, {autoSize: [1,1]});
        this.horizontal.addSlot(this.rankList);



        // this.vertical = new VerticalWidget(this, {autoSize: [1,1]});

        // this.questionPanel = new QuestionPanel(null, {autoSize: [1,0], height: 120});
        // this.vertical.addSlot(this.questionPanel);

        // this.horizontal = new HorizontalWidget(null, {autoSize: [1,1]});
        // this.vertical.addSlot(this.horizontal);

        // this.statusPanel = new StatusPanel(null, {autoSize: [1,0], height: 80});
        // this.vertical.addSlot(this.statusPanel);

        // this.leftVertical = new VerticalWidget(null, {autoSize: [1,1], width: 300, border: [10,10,10,10], margin: 10});
        // this.horizontal.addSlot(this.leftVertical);

        // this.pickPanel = new PickPanel(null, {autoSize: [1,1], height: 90});
        // this.leftVertical.addSlot(this.pickPanel);

        // this.rankList = new RankList(null, {autoSize: [1,1]});
        // this.leftVertical.addSlot(this.rankList);

        // const matchSlot = new Widget(null, {autoSize: [1,1]});
        // this.matchDisplay = new MatchDisplay(matchSlot, {anchor:[0.5,0.5], pivot:[0.5,0.5], size: [300,400]});
        // this.horizontal.addSlot(matchSlot);

    }

    refresh() {
        this.questionPanel.refresh();
        this.pickPanel.refresh();
        this.matchDisplay.refresh();
        this.rankList.refresh();
        this.statusPanel.refresh();
    }
}

//------------------------------------------------------------------------------------------
//-- MatchDisplay--------------------------------------------------------------------------
//------------------------------------------------------------------------------------------

class MatchDisplay extends BoxWidget {
    constructor(...args) {
        super(...args);

        this.set({color: bgColor});

        // this.round = new TextWidget(this, {anchor: [0.5, 0], pivot:[0.5, 0], style: 'bold', text: "Preliminaries", url: poppins});
        this.vs = new TextWidget(this, {anchor: [0.5,0.5], pivot:[0.5,0.5], style: 'bold', text: "vs.", url: poppins});

        this.frameA = new BoxWidget(this, {size: [300,70], anchor: [0.5,0.5], pivot:[0.5,1], local:[0,-50], color: bgColor});
        // this.boxA = new BoxWidget(this.frameA, {autoSize: [1,1], color: [0.5, 0.5, 0.5], border: [5,5,5,5]})
        this.labelA = new TextWidget(this.frameA, {autoSize:[1,1], point: 24, wrap: true, url: poppins});
        this.frameB = new BoxWidget(this, {size: [300,70], anchor: [0.5,0.5], pivot:[0.5,0], local:[0,50], color: bgColor});
        // this.boxA = new BoxWidget(this.frameB, {autoSize: [1,1], color: [0.5, 0.5, 0.5], border: [5,5,5,5]})
        this.labelB = new TextWidget(this.frameB, {autoSize:[1,1], point: 24, wrap: true, url: poppins});

    }

    refresh() {
        const gm = this.wellKnownModel('GameMaster');
        const m = gm.match;
        // if (gm.mode === "winner") {
        //     this.round.setText("Winner!");
        // } else if (m < 8) {
        //     this.round.setText("Preliminaries");
        // } else if (m < 12) {
        //     this.round.setText("Quarterfinals");
        // } else if (m < 14) {
        //     this.round.setText("Semifinals");
        // } else {
        //     this.round.setText("Finals");
        // }
        if (2*m+1 >= gm.brackets.length) return;
        const a = gm.brackets[2*m];
        const b = gm.brackets[2*m+1];
        this.labelA.setText(CharacterName(a));
        this.labelB.setText(CharacterName(b));
    }

}


//------------------------------------------------------------------------------------------
//-- VotePanel -----------------------------------------------------------------------------
//------------------------------------------------------------------------------------------

class VotePanel extends BoxWidget {
    constructor(...args) {
        super(...args);
        this.set({color: bgColor});

        this.vertical = new VerticalWidget(this, {autoSize: [1,1]});

        this.questionPanel = new QuestionPanel(null, {autoSize: [1,0], height: 100});
        this.vertical.addSlot(this.questionPanel);

        const matchSlot = new Widget(null, {height: 600});
        this.matchControls = new MatchControls(matchSlot, {autoSize: [1,1]});
        this.vertical.addSlot(matchSlot);

        this.horizontal = new HorizontalWidget(null, {autoSize: [1,0], border: [10,10,10,10], margin: 10});
        this.vertical.addSlot(this.horizontal);

        this.leftVertical = new VerticalWidget(null, {autoSize: [1,1], margin: 10});
        this.horizontal.addSlot(this.leftVertical);

        this.pickPanel = new PickPanel(null, {autoSize: [1,1], height: 200});
        this.leftVertical.addSlot(this.pickPanel);

        this.spacer = new Widget(null);
        this.leftVertical.addSlot(this.spacer);

        this.statusPanel = new StatusPanel(null, {autoSize: [1,1], height: 200});
        this.leftVertical.addSlot(this.statusPanel);

        this.rankList = new RankList(null, {autoSize: [1,1]});
        this.horizontal.addSlot(this.rankList);

        // this.vertical = new VerticalWidget(this, {autoSize: [1,1]});

        // this.questionPanel = new QuestionPanel(null, {autoSize: [1,0], height: 120});
        // this.vertical.addSlot(this.questionPanel);

        // this.horizontal = new HorizontalWidget(null, {autoSize: [1,1]});
        // this.vertical.addSlot(this.horizontal);

        // this.statusPanel = new StatusPanel(null, {autoSize: [1,0], height: 80});
        // this.vertical.addSlot(this.statusPanel);

        // this.leftVertical = new VerticalWidget(null, {autoSize: [1,1], width: 300, border: [10,10,10,10], margin: 10});
        // this.horizontal.addSlot(this.leftVertical);

        // this.pickPanel = new PickPanel(null, {autoSize: [1,1], height: 90});
        // this.leftVertical.addSlot(this.pickPanel);

        // this.rankList = new RankList(null, {autoSize: [1,1]});
        // this.leftVertical.addSlot(this.rankList);

        // const matchSlot = new Widget(null, {autoSize: [1,1]});
        // this.matchControls = new MatchControls(matchSlot, {anchor:[0.5,0.5], pivot:[0.5,0.5], size: [300,400]});
        // this.horizontal.addSlot(matchSlot);

    }

    refresh() {
        this.questionPanel.refresh();
        this.pickPanel.refresh();
        this.matchControls.refresh();
        this.statusPanel.refresh();
        this.rankList.refresh();
    }
}

//------------------------------------------------------------------------------------------
//-- MatchControls--------------------------------------------------------------------------
//------------------------------------------------------------------------------------------

class MatchControls extends BoxWidget {
    constructor(...args) {
        super(...args);

        this.set({color: bgColor});

        // this.round = new TextWidget(this, {anchor: [0.5, 0], pivot:[0.5, 0], style: 'bold', text: "Preliminaries", url: poppins});
        this.vs = new TextWidget(this, {anchor: [0.5,0.5], pivot:[0.5,0.5], text: "vs.", url: poppins});

        this.frameA = new BoxWidget(this, {size: [300,70], anchor: [0.5,0.5], pivot:[0.5,1], local:[0,-50], color: bgColor});
        this.buttonA = new ButtonWidget(this.frameA, {autoSize: [1,1], border: [5,5,5,5]});
        this.buttonA.label.set({point: 24, wrap: true, url: poppins});
        this.buttonA.onClick = () => this.voteA();

        this.frameB = new BoxWidget(this, {size: [300,70], anchor: [0.5,0.5], pivot:[0.5,0], local:[0,50], color: bgColor});
        this.buttonB = new ButtonWidget(this.frameB, {autoSize: [1,1], border: [5,5,5,5]});
        this.buttonB.label.set({point: 24, wrap: true, url: poppins});
        this.buttonB.onClick = () => this.voteB();
    }

    voteA() {
        if (this.vote === "a") {
            this.voteX();
            return;
        }
        this.vote = "a";
        this.frameA.set({color: [0,1,0]});
        this.frameB.set({color: bgColor});
        MyPlayerPawn().setVote("a");

    }

    voteB() {
        if (this.vote === "b") {
            this.voteX();
            return;
        }
        this.vote = "b";
        this.frameA.set({color: bgColor});
        this.frameB.set({color: [0,1,0]});
        MyPlayerPawn().setVote("b");

    }

    voteX() {
        this.vote = "x";
        this.frameA.set({color: bgColor});
        this.frameB.set({color: bgColor});
        MyPlayerPawn().setVote("x");
    }

    refresh() {
        const gm = this.wellKnownModel('GameMaster');
        const m = gm.match;
        // if (gm.mode === "winner") {
        //     this.round.setText("Winner!");
        // } else if (m < 8) {
        //     this.round.setText("Preliminaries");
        // } else if (m < 12) {
        //     this.round.setText("Quarterfinals");
        // } else if (m < 14) {
        //     this.round.setText("Semifinals");
        // } else {
        //     this.round.setText("Finals");
        // }
        if (2*m+1 >= gm.brackets.length) return;
        const a = gm.brackets[2*m];
        const b = gm.brackets[2*m+1];
        this.buttonA.label.setText(CharacterName(a));
        this.buttonB.label.setText(CharacterName(b));
        this.refreshVote();
    }

    refreshVote() {
        this.vote = MyPlayerPawn().actor.vote;
        if (this.vote === 'a') {
            this.frameA.set({color: [0,1,0]});
            this.frameB.set({color: bgColor});
        } else if (this.vote === 'b') {
            this.frameA.set({color: bgColor});
            this.frameB.set({color: [0,1,0]});
        } else {
            this.frameA.set({color: bgColor});
            this.frameB.set({color: bgColor});
        }
    }
}

//------------------------------------------------------------------------------------------
//-- CheckBoxWidget ------------------------------------------------------------------------
//------------------------------------------------------------------------------------------

// class CheckBoxWidget extends Widget {
//     constructor(...args) {
//         super(...args);

//         this.background = new BoxWidget(this, {autoSize: [1,1], color:[0.5, 0.5, 0.5]});
//         this.horizontal = new HorizontalWidget(this.background, {autoSize:[1,1], margin:5, bubbleChanges: true});
//         this.label = new TextWidget(null, {autoSize:[1,1], wrap: true, point:20});
//         this.frame = new BoxWidget(null, {autoSize:[1,1], border: [5,5,5,5], color:[0.1, 0.1, 0.1], width: 50});

//         this.horizontal.addSlot(this.label);
//         this.horizontal.addSlot(this.frame);

//         this.toggle = new ToggleWidget(this.frame, {autoSize:[1,1], border: [3,3,3,3]});
//         this.toggle.normalOff.set({color: [0.7, 0.7, 0.7]});
//         this.toggle.normalOn.set({color: [0.7, 0.7, 0.7]});
//         this.toggle.hiliteOff.set({color: [0.8, 0.8, 0.8]});
//         this.toggle.hiliteOn.set({color: [0.8, 0.8, 0.8]});
//         this.toggle.pressedOff.set({color: [0.6, 0.6, 0.6]});
//         this.toggle.pressedOn.set({color: [0.6, 0.6, 0.6]});

//         this.toggle.setLabelOn(new ImageWidget(null, {autoSize:[1,1], url: check}));
//         this.toggle.setLabelOff(new ImageWidget(null, {autoSize:[1,1]}));

//     }
// }

//------------------------------------------------------------------------------------------
//-- WinPanel ------------------------------------------------------------------------------
//------------------------------------------------------------------------------------------

class WinPanel extends BoxWidget {
    constructor(...args) {
        super(...args);
        this.set({color: bgColor});

        this.vertical = new VerticalWidget(this, {autoSize: [1,1]});

        this.questionPanel = new QuestionPanel(null, {autoSize: [1,0], height: 100});
        this.vertical.addSlot(this.questionPanel);

        const winnerSlot = new Widget(null, {height: 600});
        this.winnerAnnunciator = new WinnerAnnunciator(winnerSlot, {anchor:[0.5,0.5], pivot:[0.5,0.5]});
        this.vertical.addSlot(winnerSlot);

        this.horizontal = new HorizontalWidget(null, {autoSize: [1,0], border: [10,10,10,10], margin: 10});
        this.vertical.addSlot(this.horizontal);

        this.leftVertical = new VerticalWidget(null, {autoSize: [1,1], margin: 10});
        this.horizontal.addSlot(this.leftVertical);

        this.pickPanel = new PickPanel(null, {autoSize: [1,1], height: 200});
        this.leftVertical.addSlot(this.pickPanel);

        this.spacer = new Widget(null);
        this.leftVertical.addSlot(this.spacer);

        this.statusPanel = new StatusPanel(null, {autoSize: [1,1], height: 200});
        this.leftVertical.addSlot(this.statusPanel);

        this.rankList = new RankList(null, {autoSize: [1,1]});
        this.horizontal.addSlot(this.rankList);



        // this.vertical = new VerticalWidget(this, {autoSize: [1,1]});

        // this.questionPanel = new QuestionPanel(null, {autoSize: [1,0], height: 120});
        // this.vertical.addSlot(this.questionPanel);

        // this.horizontal = new HorizontalWidget(null, {autoSize: [1,1]});
        // this.vertical.addSlot(this.horizontal);

        // this.statusPanel = new StatusPanel(null, {autoSize: [1,0], height: 80});
        // this.vertical.addSlot(this.statusPanel);

        // this.leftVertical = new VerticalWidget(null, {autoSize: [1,1], width: 300, border: [10,10,10,10], margin: 10});
        // this.horizontal.addSlot(this.leftVertical);

        // this.pickPanel = new PickPanel(null, {autoSize: [1,1], height: 90});
        // this.leftVertical.addSlot(this.pickPanel);

        // this.rankList = new RankList(null, {autoSize: [1,1]});
        // this.leftVertical.addSlot(this.rankList);

        // const winnerSlot = new Widget(null, {autoSize: [1,1]});
        // this.winnerAnnunciator = new WinnerAnnunciator(winnerSlot, {anchor:[0.5,0.5], pivot:[0.5,0.5], size: [300,300]});
        // this.horizontal.addSlot(winnerSlot);
    }

    refresh() {
        this.questionPanel.refresh();
        this.winnerAnnunciator.refresh();
        this.statusPanel.refresh();
        this.pickPanel.refresh();
        this.rankList.refresh();
    }
}

//------------------------------------------------------------------------------------------
//-- WinnerAnnunciator ---------------------------------------------------------------------
//------------------------------------------------------------------------------------------

class WinnerAnnunciator extends BoxWidget {
    constructor(...args) {
        super(...args);

        this.set({color: bgColor});

        this.round = new TextWidget(this, {anchor: [0.5,0.5], pivot: [0.5,1], local:[0,-150], style:'bold', text: "Winner!", url: poppins});
        this.victor = new TextWidget(this, {anchor: [0.5,0.5], pivot: [0.5,0.5], local:[0,0], size: [500,100], point: 36, style:'bold', text: "Winner!", wrap: true, url: poppins});
        this.score = new TextWidget(this, {anchor: [0.5,0.5], pivot: [0.5,0], local:[0,150], size: [500,100], point: 36, style:'bold', text: "+10", url: poppins});

    }

    refresh() {
        const gm = this.wellKnownModel('GameMaster');
        const match = gm.match;
        const winner = gm.winner;
        this.victor.setText(CharacterName(winner));

        let round = 0;
        if (match < 8) {
            this.round.setText("Quarterfinalist!");
        } else if (match < 12) {
            round = 1;
            this.round.setText("Semifinalist!");
        } else if (match < 14) {
            round = 2;
            this.round.setText("Finalist!");
        } else {
            round = 3;
            this.round.setText("Winner!");
        }

        const picks = MyPlayerPawn().actor.picks;
        if (!picks) { this.hide(); return; }

        const first = picks[0];
        const second = picks[1];
        const third = picks[2];

        let points = 0;
        if (winner === first) {
            points = RoundPoints(round, 0);
            this.score.set({color:[1,0,0], text: "+" + points});
            this.score.show();
        } else if (winner === second) {
            points = RoundPoints(round, 1);
            this.score.set({color:[0,1,0], text: "+" + points});
            this.score.show();
        } else if (winner === third) {
            points = RoundPoints(round, 2);
            this.score.set({color:[0.3,0.5,1], text: "+" + points});
            this.score.show();
        } else {
            this.score.hide();
        }


    }
}

//------------------------------------------------------------------------------------------
//-- PickPanel -----------------------------------------------------------------------------
//------------------------------------------------------------------------------------------

// class PickPanel extends BoxWidget {

//     constructor(...args) {
//         super(...args);

//         this.set({color: bgColor});

//         this.horizontal = new HorizontalWidget(this, {autoSize:[1,1]});

//         this.box0 = new BoxWidget(null, {autoSize:[1,1], color: bgColor, width:50});
//         this.horizontal.addSlot(this.box0);

//         this.rank = new TextWidget(this.box0, {autoSize:[1,1], point: 28, text: "1"});

//         this.box1 = new BoxWidget(null, {autoSize:[1,1], color: [0.5, 0.5, 0.5]});
//         this.horizontal.addSlot(this.box1);

//         this.name = new TextWidget(this.box1, {autoSize:[1,1], point: 20, border: [5,0,5,0], text: "Name"});

//         this.box2 = new BoxWidget(null, {autoSize:[1,1], color: bgColor, width:50});
//         this.horizontal.addSlot(this.box2);

//         this.points = new TextWidget(this.box2, {autoSize:[1,1], point: 28, text: "+20", alignX: 'right'});
//     }

//     refresh() {
//         const gm = this.wellKnownModel('GameMaster');
//         const winner = gm.winner;
//         const match = gm.match;
//         const picks = MyPlayerPawn().actor.picks;
//         if (!picks) { this.hide(); return; }
//         let round = 0;
//         if (match > 7) round = 1;
//         if (match > 11) round = 2;
//         if (match > 13 ) round = 3;
//         const first = picks[0];
//         const second = picks[1];
//         const third = picks[2];
//         let points = 0;
//         if (winner === first) {
//             points = RoundPoints(round, 0);
//             this.box0.set({color:[1,0,0]});
//             this.rank.setText("1");
//             this.name.setText(CharacterName(first));
//             this.show();
//         } else if (winner === second) {
//             points = RoundPoints(round, 1);
//             this.box0.set({color:[0,1,0]});
//             this.rank.setText("2");
//             this.name.setText(CharacterName(second));
//             this.show();
//         } else if (winner === third) {
//             points = RoundPoints(round, 2);
//             this.box0.set({color:[0.3,0.5,1]});
//             this.rank.setText("3");
//             this.name.setText(CharacterName(third));
//             this.show();
//         } else {
//             this.hide();
//         }
//         this.points.setText("+" + points);
//     }

// }
