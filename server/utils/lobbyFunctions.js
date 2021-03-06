lobbyPlayersToGame = (party) => {
  party.users.forEach(lobbyPlayer => {
    party.gameData.users.push(lobbyPlayer);
  })
  party.users = [];
  party.gameData.users.forEach(gamePlayer => {
    gamePlayer.totaalPunten = 0;
    gamePlayer.worp = 0;
    gamePlayer.punten = 0;
    gamePlayer.active = false;
  })

  startPietjesbak(party);
}
gamePlayersToLobby = (party) => {
  party.gameData.users.forEach(player => {
    party.users.push(player);
  })
  party.gameData.users = [];
}

chooseFirstPlayer = (io, party, room) => {
  for (let i = 0; i < 10; i++) {
    setTimeout(() => {
      const randomPlayer = Math.floor(Math.random() * party.gameData.users.length);
      if (party.gameData.users[randomPlayer]) {
        makeActive(party, party.gameData.users[randomPlayer].username);
        io.to(room).emit("lobbyData", party);
      }
      if (i === 9) {
        toggleActionDone(party);
      }
    }, 200 * i);
  }
  
}
chooseFirstShootOutPlayer = (io, party, room) => {
    const randomPlayer = Math.floor(Math.random() * party.gameData.users.length);
    
    if (party.gameData.dupliqué.users[randomPlayer]) {
      makeShootOutPlayerActive(party, party.gameData.dupliqué.users[randomPlayer].username);
      io.to(room).emit("lobbyData", party);
    }

}

makeActive = (party, naam)  => {
  party.gameData.users.forEach(speler => {
    speler.active = false;
  });
  party.gameData.users.forEach(speler => {
    if (speler.username === naam) {
      speler.active = true;
    }
  });
}

makeShootOutPlayerActive = (party, naam) => {
  party.gameData.dupliqué.users.forEach(speler => {
    speler.active = false;
  });
  party.gameData.dupliqué.users.forEach(speler => {
    if (speler.username === naam) {
      speler.active = true;
    }
  });
  party.gameData.users.forEach(speler => {
    speler.active = false;
  });
  party.gameData.users.forEach(speler => {
    if (speler.username === naam) {
      speler.active = true;
    }
  });
}

toggleActionBusy = party => {
  party.gameData.actionBusy = true;
}

toggleActionDone = party => {
  party.gameData.actionBusy = false;
}

startPietjesbak = party => {
  party.gameData.users.forEach(player => {
    player.totaalPunten = 15;
  })
}

gameEnded = party => {
  party.gameData.gameStarted = false;
  party.gameData.gameEnded = true;
}

restartGameAfterEnd = (party, io, room) => {    
  setTimeout(() => {
    party.gameData.aftellen--;
    // console.log(party.gameData.aftellen);
    if (party.gameData.aftellen >= 0) {
      restartGameAfterEnd(party, io, room);
    } else {
      party.gameData.aftellen = 11
      party.gameData.gameEnded = false;
    }
    io.to(room).emit("lobbyData", party);
  }, 1000);
}

module.exports = {
  chooseFirstPlayer,
  lobbyPlayersToGame,
  gamePlayersToLobby,
  makeActive,
  toggleActionBusy,
  toggleActionDone,
  startPietjesbak,
  gameEnded,
  chooseFirstShootOutPlayer,
  restartGameAfterEnd
}