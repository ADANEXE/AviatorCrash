import { WebSocketServer, WebSocket } from "ws";
import { Server } from "http";
import { GameManager } from "./game";
import { storage } from "./storage";

type WSMessage = {
  type: string;
  data: any;
};

export function setupWebSocketServer(server: Server): GameManager {
  const wss = new WebSocketServer({
    server,
    path: '/ws'
  });
  
  // Create game manager
  const gameManager = new GameManager(storage, wss);
  
  // Initialize the game
  gameManager.initialize();
  
  wss.on('connection', (ws: WebSocket) => {
    console.log('WebSocket client connected');
    
    // Send current game state
    ws.send(JSON.stringify({
      type: 'gameState',
      data: gameManager.getCurrentState()
    }));
    
    // Send game history
    gameManager.sendGameHistory();
    
    // Send live bets if a game round is in progress
    if (gameManager.getCurrentRound()) {
      gameManager.broadcastLiveBets();
    }
    
    ws.on('message', async (message: string) => {
      try {
        const parsedMessage: WSMessage = JSON.parse(message);
        
        switch (parsedMessage.type) {
          case 'placeBet':
            if (!parsedMessage.data.userId || 
                !parsedMessage.data.amount ||
                !parsedMessage.data.sessionId) {
              ws.send(JSON.stringify({
                type: 'error',
                data: { message: 'Invalid bet data' }
              }));
              return;
            }
            
            try {
              const bet = await gameManager.placeBet(
                parsedMessage.data.userId,
                parsedMessage.data.amount,
                parsedMessage.data.autoCashoutAt || null
              );
              
              ws.send(JSON.stringify({
                type: 'betPlaced',
                data: bet
              }));
            } catch (error: any) {
              ws.send(JSON.stringify({
                type: 'error',
                data: { message: error.message }
              }));
            }
            break;
            
          case 'cashOut':
            if (!parsedMessage.data.userId || 
                !parsedMessage.data.betId ||
                !parsedMessage.data.sessionId) {
              ws.send(JSON.stringify({
                type: 'error',
                data: { message: 'Invalid cashout data' }
              }));
              return;
            }
            
            try {
              const result = await gameManager.cashOut(
                parsedMessage.data.userId,
                parsedMessage.data.betId
              );
              
              ws.send(JSON.stringify({
                type: 'cashoutSuccess',
                data: result
              }));
            } catch (error: any) {
              ws.send(JSON.stringify({
                type: 'error',
                data: { message: error.message }
              }));
            }
            break;
            
          case 'getGameHistory':
            const history = await gameManager.sendGameHistory(
              parsedMessage.data?.limit || 10
            );
            ws.send(JSON.stringify({
              type: 'gameHistory',
              data: history
            }));
            break;
            
          default:
            ws.send(JSON.stringify({
              type: 'error',
              data: { message: 'Unknown message type' }
            }));
        }
      } catch (error) {
        console.error('Error handling WebSocket message:', error);
        ws.send(JSON.stringify({
          type: 'error',
          data: { message: 'Invalid message format' }
        }));
      }
    });
    
    ws.on('close', () => {
      console.log('WebSocket client disconnected');
    });
  });
  
  return gameManager;
}
