const express = require("express")();
const server = require("http").Server(express);
const port = process.env.PORT || 3000;
const io = require("socket.io")(server);
const cors = require('cors');
const {makeUser, getCurrentUser} = require("./utils/users.js");
const {
  createParty,
  restartGame
} = require("./utils/partyData.js");
const {
  chooseFirstPlayer,
  lobbyPlayersToGame,
  makeActive,
  toggleActionBusy,
  toggleActionDone,
  startPietjesbak,
  gameEnded,
  gamePlayersToLobby,
  chooseFirstShootOutPlayer,
  restartGameAfterEnd
} = require("./utils/lobbyFunctions.js");

const router = require('./router');

let admin = false;

let lobbyData = {
  rooms: []
}

io.on("connection", socket => {
  socket.on("startPartey", (room) => {
    // console.log("plieplop");
    setInterval(() => {
      if (!lobbyData.rooms[room].gameData.gameStarted) {
        io.to(room).emit("lobbyData", lobbyData.rooms[room]);
      }
     }, 1000);
  });
  socket.on("rolStenen", (room) => {
    toggleActionBusy(lobbyData.rooms[room]);
    for (let i = 0; i < 5; i++) {
      setTimeout(() => {
        const newInt = Math.floor(Math.random() * 6) + 1;
        lobbyData.rooms[room].gameData.dobbels.dobbel1 = newInt;
        io.to(room).emit("lobbyData", lobbyData.rooms[room]);
      }, 200 * i);
    }
    for (let i = 0; i < 7; i++) {
      setTimeout(() => {
        const newInt = Math.floor(Math.random() * 6) + 1;
        lobbyData.rooms[room].gameData.dobbels.dobbel2 = newInt;
        io.to(room).emit("lobbyData", lobbyData.rooms[room]);
      }, 200 * i);
    }
    for (let i = 0; i < 9; i++) {
      setTimeout(() => {
        const newInt = Math.floor(Math.random() * 6) + 1;
        lobbyData.rooms[room].gameData.dobbels.dobbel3 = newInt;
        if (i === 8) {
          toggleActionDone(lobbyData.rooms[room]);
        }
        io.to(room).emit("lobbyData", lobbyData.rooms[room]);
      }, 200 * i);
    }
    
    io.to(room).emit("lobbyData", lobbyData.rooms[room]);
  });
  socket.on("adkDobbel", ({room, steen}) => {
    switch (steen) {
      case 1:
        lobbyData.rooms[room].gameData.adkDobbels.adkDobbel1 = lobbyData.rooms[room].gameData.dobbels.dobbel1;
        break;
      case 2:
        lobbyData.rooms[room].gameData.adkDobbels.adkDobbel2 = lobbyData.rooms[room].gameData.dobbels.dobbel2;
        break;
      case 3:
        lobbyData.rooms[room].gameData.adkDobbels.adkDobbel3 = lobbyData.rooms[room].gameData.dobbels.dobbel3;
        break;
      default:
        break;
    }
    io.to(room).emit("lobbyData", lobbyData.rooms[room]);
  });
  socket.on("resetDobbel", ({room, steen}) => {
    switch (steen) {
      case 1:
        lobbyData.rooms[room].gameData.dobbels.dobbel1 = lobbyData.rooms[room].gameData.adkDobbels.adkDobbel1;
        lobbyData.rooms[room].gameData.adkDobbels.adkDobbel1 = 0;
        break;
      case 2:
        lobbyData.rooms[room].gameData.dobbels.dobbel2 = lobbyData.rooms[room].gameData.adkDobbels.adkDobbel2;
        lobbyData.rooms[room].gameData.adkDobbels.adkDobbel2 = 0;
        break;
      case 3:
        lobbyData.rooms[room].gameData.dobbels.dobbel3 = lobbyData.rooms[room].gameData.adkDobbels.adkDobbel3;
        lobbyData.rooms[room].gameData.adkDobbels.adkDobbel3 = 0;
        break;
      default:
        break;
    }
    io.to(room).emit("lobbyData", lobbyData.rooms[room]);
  });
  socket.on("joinRoom", ({username, room}) => {
    const user = makeUser(socket.id, username, room);
    socket.join(user.room);
    
    if (lobbyData.rooms[room]) {
      console.log(lobbyData.rooms[room].gameData.users);
      console.log(user);
      
      let exist = false;

      if (lobbyData.rooms[room].users) {
        lobbyData.rooms[room].users.forEach(player => {
          if (player.username === user.username) {
            if (player.admin) {
              user.admin = true;
              console.log(user);
              
            }
            player = user;
            exist = true
            // io.to(room).emit("logData", lobbyData.rooms[room]);
          }
        })
      }
      if (lobbyData.rooms[room].gameData.users) {
        lobbyData.rooms[room].gameData.users.forEach(player => {
          if (player.username === user.username) {
            if (player.admin) {
              user.admin = true;
            }
            player = user;
            exist = true
            // io.to(room).emit("logData", lobbyData.rooms[room]);
          }
        })
      }
      if (!exist) {
        console.log("no");
        lobbyData.rooms[room].users.push(user);
        // io.to(room).emit("logData", lobbyData.rooms[room]);
      }
    } else {
      const party = createParty(user, room);
      lobbyData.rooms[room] = party;
    }
    io.to(user.room).emit("lobbyData", lobbyData.rooms[room]);
    // io.emit("logData", lobbyData.rooms[room]);
  });
  socket.on("leaveLobby", ({room, player}) => {
    // console.log(lobbyData.rooms[room].users);
    lobbyData.rooms[room].gameData.users = lobbyData.rooms[room].gameData.users.filter(userObj => {      
      return userObj.username !== player
    })
    lobbyData.rooms[room].users = lobbyData.rooms[room].users.filter(userObj => {
      return userObj.username !== player
    })

    if (player.admin) {
      if (lobbyData.rooms[room].gameData.gameStarted) {
        const i = Math.floor(Math.random() * lobbyData.rooms[room].gameData.users.length);
        lobbyData.rooms[room].gameData.users[i].admin = true;
      } else {
        const i = Math.floor(Math.random() * lobbyData.rooms[room].users.length);
        lobbyData.rooms[room].users[i].admin = true;
      }
    }
    // console.log(lobbyData.rooms[room].users);
    io.to(room).emit("lobbyData", lobbyData.rooms[room]);
  });

   socket.on("startPb", (room) => {    
    lobbyData.rooms[room].gameData.gameStarted = true;
    lobbyPlayersToGame(lobbyData.rooms[room]);
    toggleActionBusy(lobbyData.rooms[room]);
    chooseFirstPlayer(io, lobbyData.rooms[room], room);
    io.to(room).emit("lobbyData", lobbyData.rooms[room]);

    setInterval(() => {      
      io.to(room).emit("lobbyData", lobbyData.rooms[room]);
    }, 1000);
   });

  // socket.on("mountLobby", room => {
  //   const party = lobbyData.rooms[room];
  //   io.to(room).emit("lobbyData", lobbyData.rooms[room]);
  // });

  socket.on("mountPietjesbak", room => {    
    io.to(room).emit("lobbyData", lobbyData.rooms[room]);
  });

  socket.on("chooseNum", (room) => {
    let a, b, c;
    if (lobbyData.rooms[room].gameData.adkDobbels.adkDobbel1 === 0) {
      a = lobbyData.rooms[room].gameData.dobbels.dobbel1;
    } else {
      a = lobbyData.rooms[room].gameData.adkDobbels.adkDobbel1;
    }
    if (lobbyData.rooms[room].gameData.adkDobbels.adkDobbel2 === 0) {
      b = lobbyData.rooms[room].gameData.dobbels.dobbel2;
    } else {
      b = lobbyData.rooms[room].gameData.adkDobbels.adkDobbel2;
    }
    if (lobbyData.rooms[room].gameData.adkDobbels.adkDobbel3 === 0) {
      c = lobbyData.rooms[room].gameData.dobbels.dobbel3;
    } else {
      c = lobbyData.rooms[room].gameData.adkDobbels.adkDobbel3;
    }
    lobbyData.rooms[room].gameData.worpArray = [a, b, c];
    io.to(room).emit("lobbyData", lobbyData.rooms[room]);
  });
  socket.on("berekenStenen", (room) => {
    lobbyData.rooms[room].gameData.worpArray.sort((a, b) => b - a);
    lobbyData.rooms[room].gameData.tempWorp.stenen =
      lobbyData.rooms[room].gameData.worpArray[0].toString() +
      lobbyData.rooms[room].gameData.worpArray[1].toString() +
      lobbyData.rooms[room].gameData.worpArray[2].toString();

    switch (lobbyData.rooms[room].gameData.tempWorp.stenen) {
      case "421":
        lobbyData.rooms[room].gameData.tempWorp.waarde = "4-21";
        lobbyData.rooms[room].gameData.tempWorp.punten = 8;
        break;
      case "111":
        lobbyData.rooms[room].gameData.tempWorp.waarde = "Pietje 7";
        lobbyData.rooms[room].gameData.tempWorp.punten = 7;
        break;
      case "611":
        lobbyData.rooms[room].gameData.tempWorp.waarde = "Pietje 6";
        lobbyData.rooms[room].gameData.tempWorp.punten = 6;
        break;
      case "511":
        lobbyData.rooms[room].gameData.tempWorp.waarde = "Pietje 5";
        lobbyData.rooms[room].gameData.tempWorp.punten = 5;
        break;
      case "411":
        lobbyData.rooms[room].gameData.tempWorp.waarde = "Pietje 4";
        lobbyData.rooms[room].gameData.tempWorp.punten = 4;
        break;
      case "311":
        lobbyData.rooms[room].gameData.tempWorp.waarde = "Pietje 3";
        lobbyData.rooms[room].gameData.tempWorp.punten = 3;
        break;
      case "211":
        lobbyData.rooms[room].gameData.tempWorp.waarde = "Pietje 2";
        lobbyData.rooms[room].gameData.tempWorp.punten = 2;
        break;
      case "666":
        lobbyData.rooms[room].gameData.tempWorp.waarde = "Trieske";
        lobbyData.rooms[room].gameData.tempWorp.punten = 3;
        break;
      case "555":
        lobbyData.rooms[room].gameData.tempWorp.waarde = "Trieske";
        lobbyData.rooms[room].gameData.tempWorp.punten = 3;
        break;
      case "444":
        lobbyData.rooms[room].gameData.tempWorp.waarde = "Trieske";
        lobbyData.rooms[room].gameData.tempWorp.punten = 3;
        break;
      case "333":
        lobbyData.rooms[room].gameData.tempWorp.waarde = "Trieske";
        lobbyData.rooms[room].gameData.tempWorp.punten = 3;
        break;
      case "222":
        lobbyData.rooms[room].gameData.tempWorp.waarde = "Trieske";
        lobbyData.rooms[room].gameData.tempWorp.punten = 3;
        break;
      case "654":
        lobbyData.rooms[room].gameData.tempWorp.waarde = "Straatje";
        lobbyData.rooms[room].gameData.tempWorp.punten = 2;
        break;
      case "543":
        lobbyData.rooms[room].gameData.tempWorp.waarde = "Straatje";
        lobbyData.rooms[room].gameData.tempWorp.punten = 2;
        break;
      case "432":
        lobbyData.rooms[room].gameData.tempWorp.waarde = "Straatje";
        lobbyData.rooms[room].gameData.tempWorp.punten = 2;
        break;
      case "321":
        lobbyData.rooms[room].gameData.tempWorp.waarde = "Straatje";
        lobbyData.rooms[room].gameData.tempWorp.punten = 2;
        break;
      default:
        lobbyData.rooms[room].gameData.tempWorp.waarde = lobbyData.rooms[room].gameData.tempWorp.stenen;
        lobbyData.rooms[room].gameData.tempWorp.punten = 1;
        break;
    }
    io.to(room).emit("lobbyData", lobbyData.rooms[room]);
  });

  socket.on("toggleHerkans", (room) => {
    lobbyData.rooms[room].gameData.rondeWorpen.waarde = 0;
    lobbyData.rooms[room].gameData.maxAantalWorpen.herkans = true;
    io.to(room).emit("lobbyData", lobbyData.rooms[room]);
  });

  socket.on("herdoenMinpunten", (room) => {
    lobbyData.rooms[room].gameData.users.forEach(speler => {
      if (speler.active) {
        speler.totaalPunten -= lobbyData.rooms[room].gameData.tempWorp.punten;
      }
    });
    lobbyData.rooms[room].gameData.users.forEach(speler => {
      speler.punten = 0;
      speler.worp = 0;
    });
    io.to(room).emit("lobbyData", lobbyData.rooms[room]);
  });

  socket.on("addMaxWorpen", (room) => {
    lobbyData.rooms[room].gameData.maxAantalWorpen.waarde = lobbyData.rooms[room].gameData.rondeWorpen.waarde;
    lobbyData.rooms[room].gameData.rondeWorpen.waarde = 0;
    lobbyData.rooms[room].gameData.maxAantalWorpen.door = lobbyData.rooms[room].gameData.rondeWorpen.door;
    io.to(room).emit("lobbyData", lobbyData.rooms[room]);
  });

  socket.on("addRondeWorp", (room) => {
    lobbyData.rooms[room].gameData.rondeWorpen.waarde ++;
    
    lobbyData.rooms[room].gameData.users.forEach(speler => {
      if (speler.active) {
        lobbyData.rooms[room].gameData.rondeWorpen.door = speler.username;
      }
    });
    io.to(room).emit("lobbyData", lobbyData.rooms[room]);
  });

  socket.on("addGesmetenSpelers", ({room, naam}) => {
    lobbyData.rooms[room].gameData.gesmetenSpelers.push(naam);
    io.to(room).emit("lobbyData", lobbyData.rooms[room]);
  });
  socket.on("resetRondeWorpen", (room) => {
    lobbyData.rooms[room].gameData.rondeWorpen.waarde = 0;
    io.to(room).emit("lobbyData", lobbyData.rooms[room]);
  });

  socket.on("addPunten", (room) => {
    if (lobbyData.rooms[room].gameData.dupliqué.vanToepassing) {
      lobbyData.rooms[room].gameData.dupliqué.users.forEach(speler => {
        if (speler.active) {
          speler.punten = lobbyData.rooms[room].gameData.tempWorp.punten;
        }
      })
    } else {
      lobbyData.rooms[room].gameData.users.forEach(speler => {
        if (speler.active) {
          speler.punten = lobbyData.rooms[room].gameData.tempWorp.punten;
        }
      });
    }
    io.to(room).emit("lobbyData", lobbyData.rooms[room]);
  });

  socket.on("addWorp", (room) => {
    if (lobbyData.rooms[room].gameData.dupliqué.vanToepassing) {
      lobbyData.rooms[room].gameData.dupliqué.users.forEach(speler => {
        if (speler.active) {
          speler.worp = lobbyData.rooms[room].gameData.tempWorp.waarde;
        }
      })
    } else {
      lobbyData.rooms[room].gameData.users.forEach(speler => {
        if (speler.active) {
          speler.worp = lobbyData.rooms[room].gameData.tempWorp.waarde;
        }
      });
    }
    io.to(room).emit("lobbyData", lobbyData.rooms[room]);
    
  });

  socket.on("completeStats", (room) => {
    if (!lobbyData.rooms[room].gameData.dupliqué.vanToepassing) {
      if (
        lobbyData.rooms[room].gameData.hoogste.punten < lobbyData.rooms[room].gameData.tempWorp.punten ||
        (lobbyData.rooms[room].gameData.tempWorp.waarde === "Pietje 2" &&
          lobbyData.rooms[room].gameData.hoogste.waarde === "Trieske")
      ) {
        if (
          !(
            lobbyData.rooms[room].gameData.hoogste.waarde === "Pietje 2" &&
            lobbyData.rooms[room].gameData.tempWorp.waarde === "Trieske"
          )
        ) {
          lobbyData.rooms[room].gameData.hoogste.waarde = lobbyData.rooms[room].gameData.tempWorp.waarde;
          lobbyData.rooms[room].gameData.hoogste.punten = lobbyData.rooms[room].gameData.tempWorp.punten;
          lobbyData.rooms[room].gameData.users.forEach(speler => {
            if (speler.active) {
              lobbyData.rooms[room].gameData.hoogste.door = speler.username;
            }
          });
        }
      } else if (
        lobbyData.rooms[room].gameData.tempWorp.waarde === "Pietje 2" &&
        lobbyData.rooms[room].gameData.hoogste.waarde === "Straatje"
      ) {
        lobbyData.rooms[room].gameData.hoogste.waarde = lobbyData.rooms[room].gameData.tempWorp.waarde;
        lobbyData.rooms[room].gameData.hoogste.punten = lobbyData.rooms[room].gameData.tempWorp.punten;
        lobbyData.rooms[room].gameData.users.forEach(speler => {
          if (speler.active) {
            lobbyData.rooms[room].gameData.hoogste.door = speler.username;
          }
        });
      } else if (
        lobbyData.rooms[room].gameData.hoogste.punten === lobbyData.rooms[room].gameData.tempWorp.punten &&
        lobbyData.rooms[room].gameData.tempWorp.punten === 1 &&
        parseInt(lobbyData.rooms[room].gameData.hoogste.waarde) < parseInt(lobbyData.rooms[room].gameData.tempWorp.waarde)
      ) {
        lobbyData.rooms[room].gameData.hoogste.waarde = lobbyData.rooms[room].gameData.tempWorp.waarde;
        lobbyData.rooms[room].gameData.hoogste.punten = lobbyData.rooms[room].gameData.tempWorp.punten;
        lobbyData.rooms[room].gameData.users.forEach(speler => {
          if (speler.active) {
            lobbyData.rooms[room].gameData.hoogste.door = speler.username;
          }
        });
      }
    }

    // --- LAAGSTE --- //
    if (
      lobbyData.rooms[room].gameData.laagste.punten > lobbyData.rooms[room].gameData.tempWorp.punten ||
      (lobbyData.rooms[room].gameData.tempWorp.waarde === "Trieske" &&
        lobbyData.rooms[room].gameData.laagste.waarde === "Pietje 2") ||
      (lobbyData.rooms[room].gameData.tempWorp.waarde === "Straatje" &&
        lobbyData.rooms[room].gameData.laagste.waarde === "Pietje 2")
    ) {
      if (
        !(
          lobbyData.rooms[room].gameData.tempWorp.waarde === "Pietje 2" &&
          lobbyData.rooms[room].gameData.laagste.waarde === "Trieske"
        )
      ) {
        lobbyData.rooms[room].gameData.laagste.waarde = lobbyData.rooms[room].gameData.tempWorp.waarde;
        lobbyData.rooms[room].gameData.laagste.punten = lobbyData.rooms[room].gameData.tempWorp.punten;
        lobbyData.rooms[room].gameData.users.forEach(speler => {
          if (speler.active) {
            lobbyData.rooms[room].gameData.laagste.door = speler.username;
          }
        });
      }
    } else if (
      lobbyData.rooms[room].gameData.laagste.punten === lobbyData.rooms[room].gameData.tempWorp.punten &&
      lobbyData.rooms[room].gameData.tempWorp.punten === 1 &&
      parseInt(lobbyData.rooms[room].gameData.laagste.waarde) > parseInt(lobbyData.rooms[room].gameData.tempWorp.waarde)
    ) {
      lobbyData.rooms[room].gameData.laagste.waarde = lobbyData.rooms[room].gameData.tempWorp.waarde;
      lobbyData.rooms[room].gameData.laagste.punten = lobbyData.rooms[room].gameData.tempWorp.punten;
      lobbyData.rooms[room].gameData.users.forEach(speler => {
        if (speler.active) {
          lobbyData.rooms[room].gameData.laagste.door = speler.username;
        }
      });
    } else if (lobbyData.rooms[room].gameData.laagste.waarde === "0") {
      lobbyData.rooms[room].gameData.laagste.waarde = lobbyData.rooms[room].gameData.tempWorp.waarde;
      lobbyData.rooms[room].gameData.laagste.punten = lobbyData.rooms[room].gameData.tempWorp.punten;
      lobbyData.rooms[room].gameData.users.forEach(speler => {
        if (speler.active) {
          lobbyData.rooms[room].gameData.laagste.door = speler.username;
        }
      });
    }

    io.to(room).emit("lobbyData", lobbyData.rooms[room]);
  });

  socket.on("selectNextPlayer", (room) => {
    let i = 0;
    if (lobbyData.rooms[room].gameData.dupliqué.vanToepassing) {
      lobbyData.rooms[room].gameData.dupliqué.users.forEach((speler, index) => {
        if (speler.active) {
          speler.active = false;
          if (index !== lobbyData.rooms[room].gameData.dupliqué.users.length - 1) {
            i = index + 1;
          } else {
            i = 0;
          }
        }
      });
      lobbyData.rooms[room].gameData.users.forEach((speler) => {
        if (speler.active) {
          speler.active = false;
        }
        if (speler.username === lobbyData.rooms[room].gameData.dupliqué.users[i].username) {
          speler.active = true;
        }
      });
      lobbyData.rooms[room].gameData.dupliqué.users[i].active = true;
    } else {
      lobbyData.rooms[room].gameData.users.forEach((speler, index) => {
        if (speler.active) {
          speler.active = false;
          if (index !== lobbyData.rooms[room].gameData.users.length - 1) {
            i = index + 1;
          } else {
            i = 0;
          }
        }
      });
      if (lobbyData.rooms[room].gameData.users[i]) {
        lobbyData.rooms[room].gameData.users[i].active = true;
      }
    }

    io.to(room).emit("lobbyData", lobbyData.rooms[room]);
  });

  socket.on("deselectAllPlayers", (room) => {
    lobbyData.rooms[room].gameData.users.forEach(speler => {
      if (speler.active) {
        speler.active = false;
      }
    });
    io.to(room).emit("lobbyData", lobbyData.rooms[room]);
  });
  socket.on("resetMaxWorpen", (room) => {
    lobbyData.rooms[room].gameData.maxAantalWorpen.waarde = 0;
    lobbyData.rooms[room].gameData.maxAantalWorpen.door = "";
    lobbyData.rooms[room].gameData.maxAantalWorpen.herkans = false;
    io.to(room).emit("lobbyData", lobbyData.rooms[room]);
  });
  socket.on("resetGesmetenSpelers", (room) => {
    lobbyData.rooms[room].gameData.gesmetenSpelers = [];
    io.to(room).emit("lobbyData", lobbyData.rooms[room]);
  });
  socket.on("volgendeRonde", (room) => {
    lobbyData.rooms[room].gameData.users.forEach(speler => {
      if (speler.username === lobbyData.rooms[room].gameData.laagste.door) {
        speler.totaalPunten -= lobbyData.rooms[room].gameData.hoogste.punten;
        io.to(room).emit("lobbyData", lobbyData.rooms[room]);
        if (speler.totaalPunten <= 0) {
          endGame(room, speler);
        }
      }
    });
    lobbyData.rooms[room].gameData.users.forEach(speler => {
      speler.punten = 0;
      speler.worp = 0;
    });

    lobbyData.rooms[room].gameData.users.forEach(speler => {
      if (speler.active) {
        speler.active = false;
      }
    });

    lobbyData.rooms[room].gameData.users.forEach(speler => {
      if (speler.username === lobbyData.rooms[room].gameData.laagste.door) {
        speler.active = true;
      }
    });

    lobbyData.rooms[room].gameData.laagste.door = "";
    lobbyData.rooms[room].gameData.laagste.waarde = "0";
    lobbyData.rooms[room].gameData.laagste.punten = 0;
    lobbyData.rooms[room].gameData.hoogste.door = "";
    lobbyData.rooms[room].gameData.hoogste.waarde = "0";
    lobbyData.rooms[room].gameData.hoogste.punten = 0;
    lobbyData.rooms[room].gameData.aantalWorpen = 0;

    io.to(room).emit("lobbyData", lobbyData.rooms[room]);
  });
  socket.on("startShootOut", ({room, dupliquéSpelers}) => {
    lobbyData.rooms[room].gameData.dupliqué.users = dupliquéSpelers;
    lobbyData.rooms[room].gameData.dupliqué.vanToepassing = true;
    chooseFirstShootOutPlayer(io, lobbyData.rooms[room], room);
    io.to(room).emit("lobbyData", lobbyData.rooms[room]);
  });
  socket.on("setMaxWorpenToShootOut", (room) => {
    lobbyData.rooms[room].gameData.maxAantalWorpen.waarde = 1;
    lobbyData.rooms[room].gameData.maxAantalWorpen.door = "";
    lobbyData.rooms[room].gameData.maxAantalWorpen.herkans = true;
    io.to(room).emit("lobbyData", lobbyData.rooms[room]);
  });
  socket.on("resetIfShootOut", (room) => {
    lobbyData.rooms[room].gameData.dupliqué.users = [];
    lobbyData.rooms[room].gameData.dupliqué.vanToepassing = false;
    io.to(room).emit("lobbyData", lobbyData.rooms[room]);
  });
  socket.on("makeAdmin", (room) => {
    if (lobbyData.rooms[room].gameData.gameStarted && lobbyData.rooms[room].gameData.users.length !== 0) {
      const randy = Math.floor(Math.random() * lobbyData.rooms[room].gameData.users.length);
      lobbyData.rooms[room].gameData.users[randy].admin = true;
    } else if (lobbyData.rooms[room].users.length !== 0) {
      const randy = Math.floor(Math.random() * lobbyData.rooms[room].users.length);
      lobbyData.rooms[room].users[randy].admin = true;
    }
    io.to(room).emit("lobbyData", lobbyData.rooms[room]);
  });
  socket.on("restartGameAfterEnd", (room) => {
    lobbyData.rooms[room].gameData.aftellen = 11;
    io.to(room).emit("lobbyData", lobbyData.rooms[room]);

    restartGameAfterEnd(lobbyData.rooms[room], io, room);

    io.to(room).emit("lobbyData", lobbyData.rooms[room]);
  });
  socket.on("tempEndBut", (room) => {
    endGame(room, lobbyData.rooms[room].users[1])
    io.to(room).emit("lobbyData", lobbyData.rooms[room]);
  });
});

endGame = (room, speler) => {
  gameEnded(lobbyData.rooms[room]);
  io.to(room).emit("loser", speler.username);

  const party = restartGame(lobbyData.users, room);
  gamePlayersToLobby(lobbyData.rooms[room])
}

express.use(router);
express.use(cors());

server.listen(port, () => {
});
