import React, { useState, useEffect } from 'react';
import { socket } from "@/lib/socket";
import { ArrowLeft, Users, Clock, Trophy, X, Copy } from 'lucide-react';
import { useToast } from '@/context/ToastContext';

const GameRoom = ({ quiz, setCurrentPage, username, refreshQuizzes }) => {
	const { showSuccess, showError, showInfo } = useToast();

    const [roomId, setRoomId] = useState(null);
    const [players, setPlayers] = useState([]);
    const [gameState, setGameState] = useState('waiting'); // waiting, playing, results, finished
    const [currentQuestion, setCurrentQuestion] = useState(null);
    const [questionNumber, setQuestionNumber] = useState(0);
    const [totalQuestions, setTotalQuestions] = useState(0);
    const [countdown, setCountdown] = useState(null);
    const [countdownInterval, setCountdownInterval] = useState(null);
    const [questionResults, setQuestionResults] = useState(null);
    const [gameResults, setGameResults] = useState(null);

    useEffect(() => {
        // Criar a sala assim que o componente for montado
        socket.emit('create_room', {
            quiz,
            hostName: username
        });

        // Evento de sala criada
        const handleRoomCreated = (data) => {
            showSuccess(`Sala criada com sucesso! Código: ${data.roomId}`);
            setRoomId(data.roomId);
        };

        // Evento de jogador entrou
        const handlePlayerJoined = (data) => {
            console.log("Jogador entrou:", data);
            setPlayers(data.players);
        };

        // Evento de jogador saiu
        const handlePlayerLeft = (data) => {
            console.log("Jogador saiu:", data);
            setPlayers(data.players);
        };

        // Evento de jogador respondeu
        const handlePlayerAnswered = (data) => {
            console.log("Jogador respondeu:", data);
            // Atualizar visualmente que o jogador respondeu
            setPlayers(prevPlayers => 
                prevPlayers.map(player => 
                    player.id === data.playerId 
                        ? { ...player, answered: true } 
                        : player
                )
            );
        };

        // Evento de pergunta
        const handleQuestion = (data) => {
            console.log("Nova pergunta:", data);
            setGameState('playing');
            setCurrentQuestion(data.questionData);
            setQuestionNumber(data.questionNumber);
            setTotalQuestions(data.totalQuestions);
            setQuestionResults(null);
            
            // Resetar status de resposta dos jogadores
            setPlayers(prevPlayers => 
                prevPlayers.map(player => ({ ...player, answered: false }))
            );
            
            // Iniciar contagem regressiva
            startCountdown(data.timeLimit || 60);
        };

        // Evento de resultados da pergunta
        const handleQuestionResults = (data) => {
            console.log("Resultados da pergunta:", data);
            setGameState('results');
            setQuestionResults(data);
            
            // Parar contagem regressiva
            if (countdownInterval) {
                clearInterval(countdownInterval);
                setCountdownInterval(null);
            }
            
            // Atualizar pontuações dos jogadores
            setPlayers(data.playerScores);
        };

        // Evento de fim de jogo
        const handleGameOver = (data) => {
            console.log("Fim de jogo:", data);
            setGameState('finished');
            setGameResults(data);
            
            // Limpar qualquer contagem regressiva
            if (countdownInterval) {
                clearInterval(countdownInterval);
                setCountdownInterval(null);
            }
        };

        // Evento de erro
        const handleError = (data) => {
            console.error("Erro:", data.message);
			showError(data.message);
        };

        // Evento de sala fechada (quando outro host sai)
        const handleRoomClosed = (data) => {
			showInfo("O host fechou a sala.");
            setCurrentPage(null);
        };

        // Registrar eventos
        socket.on('room_created', handleRoomCreated);
        socket.on('player_joined', handlePlayerJoined);
        socket.on('player_left', handlePlayerLeft);
        socket.on('player_answered', handlePlayerAnswered);
        socket.on('question', handleQuestion);
        socket.on('question_results', handleQuestionResults);
        socket.on('game_over', handleGameOver);
        socket.on('error', handleError);
        socket.on('room_closed', handleRoomClosed);

        // Limpeza ao desmontar
        return () => {
            socket.off('room_created', handleRoomCreated);
            socket.off('player_joined', handlePlayerJoined);
            socket.off('player_left', handlePlayerLeft);
            socket.off('player_answered', handlePlayerAnswered);
            socket.off('question', handleQuestion);
            socket.off('question_results', handleQuestionResults);
            socket.off('game_over', handleGameOver);
            socket.off('error', handleError);
            socket.off('room_closed', handleRoomClosed);
            
            if (countdownInterval) {
                clearInterval(countdownInterval);
            }
        };
    }, [quiz, username, setCurrentPage]);

    // Função para iniciar o jogo
    const startGame = () => {
        if (players.length === 0) {
			showError("Você precisa de pelo menos um jogador para iniciar!");
            return;
        }
        
        socket.emit('start_game');
		showInfo("Iniciando o jogo...");
    };

    // Função para avançar para próxima pergunta manualmente
    const nextQuestion = () => {
        if (gameState === 'playing' || gameState === 'results') {
            socket.emit('next_question');
            
            // Limpar contagem regressiva atual
            if (countdownInterval) {
                clearInterval(countdownInterval);
                setCountdownInterval(null);
            }
        }
    };

    // Função para iniciar contagem regressiva
    const startCountdown = (seconds) => {
        // Limpar qualquer intervalo existente
        if (countdownInterval) {
            clearInterval(countdownInterval);
        }
        
        setCountdown(seconds);
        
        const interval = setInterval(() => {
            setCountdown(prev => {
                if (prev <= 1) {
                    clearInterval(interval);
                    setCountdownInterval(null);
                    // Quando o tempo acabar, seguir para a próxima pergunta
                    nextQuestion();
                    return 0;
                }
                return prev - 1;
            });
        }, 1000);
        
        setCountdownInterval(interval);
    };

    // Função para copiar o código da sala para o clipboard
    const copyRoomCode = () => {
        navigator.clipboard.writeText(roomId);
		showInfo("Código da sala copiado para a área de transferência!");
    };

    // Função para voltar ao lobby
    const backToLobby = () => {
        if (gameState !== 'waiting' && !confirm("Tem certeza que deseja sair? O jogo será encerrado.")) {
            return;
        }
        setCurrentPage(null);
    };

    return (
        <div className="w-full max-w-4xl mx-auto py-8 px-4">
            {/* Tela de espera */}
            {gameState === 'waiting' && (
                <div className="flex flex-col gap-6 items-center">
                    <div className="flex items-center justify-between w-full">
                        <button
                            onClick={backToLobby}
                            className="flex items-center justify-center w-10 h-10 rounded-full hover:bg-white/10 transition"
                        >
                            <ArrowLeft size={24} className="text-white/70" />
                        </button>
                        <h1 className="text-3xl font-bold text-center text-white">{quiz.title}</h1>
                        <div className="w-10"></div> {/* Espaçador para centralizar título */}
                    </div>
                    
                    {roomId && (
                        <div className="flex flex-col gap-4 items-center bg-white/10 p-6 rounded-xl w-full max-w-md">
                            <h2 className="text-xl text-white font-semibold">Sala Criada!</h2>
                            
                            <div className="flex items-center gap-2 bg-white/10 px-4 py-2 rounded-lg">
                                <span className="text-2xl font-bold text-white">{roomId}</span>
                                <button 
                                    onClick={copyRoomCode}
                                    className="p-2 rounded-full hover:bg-white/10 transition"
                                    title="Copiar código"
                                >
                                    <Copy size={18} className="text-white" />
                                </button>
                            </div>
                            
                            <p className="text-white/80 text-center">
                                Compartilhe este código com os jogadores para entrarem na sala.
                            </p>
                        </div>
                    )}
                    
                    <div className="w-full max-w-md">
                        <div className="flex items-center justify-between mb-2">
                            <div className="flex items-center gap-2">
                                <Users size={18} className="text-white/70" />
                                <h3 className="text-white font-semibold">Jogadores ({players.length})</h3>
                            </div>
                            {players.length > 0 && (
                                <button
                                    onClick={startGame}
                                    className="px-3 py-1 rounded-md bg-rose-500 hover:bg-rose-600 text-white text-sm transition"
                                >
                                    Iniciar Quiz
                                </button>
                            )}
                        </div>
                        
                        {players.length === 0 ? (
                            <div className="bg-white/5 rounded-lg p-4 text-white/50 text-center">
                                Aguardando jogadores...
                            </div>
                        ) : (
                            <div className="bg-white/5 rounded-lg overflow-hidden">
                                {players.map((player, index) => (
                                    <div 
                                        key={player.id}
                                        className={`
                                            flex items-center justify-between p-4
                                            ${index < players.length - 1 ? 'border-b border-white/10' : ''}
                                        `}
                                    >
                                        <span className="text-white">{player.name}</span>
                                        {player.score > 0 && (
                                            <span className="text-white/70 text-sm">{player.score} pts</span>
                                        )}
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            )}
            
            {/* Tela de jogo - pergunta */}
            {gameState === 'playing' && currentQuestion && (
                <div className="flex flex-col gap-6">
                    <div className="flex justify-between items-center">
                        <div>
                            <h2 className="text-white/60 text-sm">Pergunta {questionNumber} de {totalQuestions}</h2>
                            <h1 className="text-2xl font-bold text-white">{currentQuestion.title}</h1>
                        </div>
                        
                        <div className="flex items-center gap-2 bg-white/10 px-4 py-2 rounded-lg">
                            <Clock size={18} className="text-white/70" />
                            <span className={`text-xl font-bold ${countdown < 10 ? 'text-rose-500' : 'text-white'}`}>
                                {countdown}s
                            </span>
                        </div>
                    </div>
                    
                    {/* Grade de opções */}
                    <div className="grid grid-cols-2 gap-4">
                        {currentQuestion.options.map((option, index) => (
                            <div 
                                key={index}
                                className="relative rounded-xl overflow-hidden border-2 h-48"
                                style={{ 
                                    borderColor: ['#E21B3C', '#1368CE', '#FFA602', '#26890C'][index]
                                }}
                            >
                                {option.image ? (
                                    <div 
                                        className="w-full h-full bg-center bg-cover flex items-end justify-center"
                                        style={{ backgroundImage: `url(${option.image})` }}
                                    >
                                        <div 
                                            className="w-full py-3 px-4 text-center text-white font-semibold"
                                            style={{ 
                                                backgroundColor: ['#E21B3C', '#1368CE', '#FFA602', '#26890C'][index]
                                            }}
                                        >
                                            {option.text}
                                        </div>
                                    </div>
                                ) : (
                                    <div 
                                        className="w-full h-full flex items-center justify-center"
                                        style={{ 
                                            backgroundColor: ['#E21B3C', '#1368CE', '#FFA602', '#26890C'][index],
                                            opacity: 0.8
                                        }}
                                    >
                                        <span className="text-white font-bold text-lg">{option.text}</span>
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                    
                    <div className="mt-4">
                        <div className="flex items-center gap-2 mb-2">
                            <Users size={18} className="text-white/70" />
                            <h3 className="text-white font-semibold">
                                Jogadores que responderam: {players.filter(p => p.answered).length}/{players.length}
                            </h3>
                        </div>
                        
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                            {players.map(player => (
                                <div 
                                    key={player.id}
                                    className={`
                                        p-2 rounded-lg text-center text-sm
                                        ${player.answered ? 'bg-green-500/20 text-green-300' : 'bg-white/10 text-white/70'}
                                    `}
                                >
                                    {player.name}
                                </div>
                            ))}
                        </div>
                    </div>
                    
                    <button
                        onClick={nextQuestion}
                        className="mt-4 px-4 py-2 w-full sm:w-auto rounded-md bg-rose-500 text-white hover:bg-rose-600 transition"
                    >
                        Próxima Pergunta
                    </button>
                </div>
            )}
            
            {/* Tela de resultados da pergunta */}
            {gameState === 'results' && questionResults && (
                <div className="flex flex-col gap-6">
                    <h1 className="text-2xl font-bold text-white text-center">Resultados da Pergunta {questionResults.questionNumber}</h1>
                    
                    <div className="bg-white/10 p-6 rounded-xl">
                        <div className="flex flex-col gap-4 items-center">
                            <div className="text-center">
                                <h2 className="text-xl text-white font-semibold">Resposta Correta</h2>
                                <p className="text-white/80 mt-1">{questionResults.correctOptionText}</p>
                            </div>
                            
                            <div className="w-full">
                                <h3 className="text-white font-semibold mb-2">Placar Atual</h3>
                                <div className="bg-white/5 rounded-lg overflow-hidden">
                                    {players.slice(0, 8).map((player, index) => (
                                        <div 
                                            key={player.id}
                                            className={`
                                                flex items-center justify-between p-3
                                                ${index < players.length - 1 ? 'border-b border-white/10' : ''}
                                            `}
                                        >
                                            <div className="flex items-center gap-2">
                                                <span className="w-5 h-5 flex items-center justify-center bg-white/20 rounded-full text-white text-xs">
                                                    {index + 1}
                                                </span>
                                                <span className="text-white">{player.name}</span>
                                            </div>
                                            <span className="text-white font-bold">{player.score}</span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </div>
                    
                    <button
                        onClick={nextQuestion}
                        className="px-4 py-2 w-full sm:w-auto mx-auto rounded-md bg-rose-500 text-white hover:bg-rose-600 transition"
                    >
                        Próxima Pergunta
                    </button>
                </div>
            )}
            
            {/* Tela de fim de jogo */}
            {gameState === 'finished' && gameResults && (
                <div className="flex flex-col gap-6 items-center">
                    <h1 className="text-3xl font-bold text-white">Resultado Final</h1>
                    
                    <div className="w-full max-w-md bg-white/10 rounded-xl overflow-hidden">
                        <div className="p-4 bg-rose-500 text-white font-bold text-center">
                            <Trophy size={24} className="inline-block mr-2" />
                            Ranking
                        </div>
                        
                        {gameResults.ranking.map((player) => (
                            <div 
                                key={player.id}
                                className="flex items-center justify-between p-4 border-b border-white/10 last:border-b-0"
                            >
                                <div className="flex items-center gap-3">
                                    <span className={`
                                        w-8 h-8 rounded-full flex items-center justify-center font-bold
                                        ${player.rank === 1 ? 'bg-yellow-500 text-yellow-900' : 
                                        player.rank === 2 ? 'bg-gray-300 text-gray-800' : 
                                        player.rank === 3 ? 'bg-amber-700 text-amber-100' : 
                                        'bg-white/20 text-white'}
                                    `}>
                                        {player.rank}
                                    </span>
                                    <span className="text-white font-medium">{player.name}</span>
                                </div>
                                <span className="text-white font-bold">{player.score} pts</span>
                            </div>
                        ))}
                    </div>
                    
                    <button
                        onClick={backToLobby}
                        className="px-4 py-2 rounded-md bg-white/10 text-white hover:bg-white/20 transition"
                    >
                        Voltar ao Lobby
                    </button>
                </div>
            )}
        </div>
    );
};

export default GameRoom;