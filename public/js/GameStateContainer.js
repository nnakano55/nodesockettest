class GameStateContainer extends Map{
	
	constructor(){
		super();
	}

	checkOpponentInfo(frame, inputs){

		if(this.has(frame)){
			let gameState = this.get(frame);
			let stateInput = gameState.opponentInput;
			if(stateInput.up != inputs.up || stateInput.down != inputs.down){
				this.set(frame, {
					frame: frame,
					playerInput: Object.assign({}, gameState.playerInput),
					opponentInput: Object.assign({}, inputs),
					ball: Object.assign({}, gameState.ball),
					player1Position: Object.assign({}, gameState.player1Position),
					player2Position: Object.assign({}, gameState.player2Position),
					predictionWrong: true,
					predicted: false
				});
			}
		} else {
			let gameState = {
				frame: frame, 
				opponentInput: Object.assign({}, inputs),
				predictionWrong: false,
				predicted: false
			};
			this.set(frame, gameState);
		}

	}

	//returns frame of first frame where rollback has predicted the inputs wrong
	getFirstPredictedWrong(startFrame){
		for(let i = startFrame; i < this.size; i++){
			if(this.has(i) && this.get(i).predictionWrong)
				return this.get(i).frame;
		}
		return undefined;
	}


}