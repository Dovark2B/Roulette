(function () {
  // Placeholder : on filtrera plus tard comme tu veux
  const ACTION_NAME = 'MK_ROULETTE_SPIN'; // <-- à remplacer par le nom réel de ton Action Streamer.bot

  function setupStreambotClient() {
    try {
      const sbServerAddress = '127.0.0.1';
      const sbServerPort = 8080;

      // StreamerbotClient est exposé par le script CDN [web:1]
      const client = new StreamerbotClient({
        host: sbServerAddress,
        port: sbServerPort,

        // Si tu actives l'auth côté Streamer.bot, ajoute: password: '...'
        // Le client supporte des options host/port/password/endpoint selon la doc [web:5]

        onConnect: () => {
          console.log(`✨ Connecté à Streamer.bot ${sbServerAddress}:${sbServerPort}`);
        },
        onDisconnect: () => {
          console.log('❌ Déconnecté de Streamer.bot');
        }
      });

      // Écoute Raw.Action (évènement officiel côté WS) [web:9]
      client.on('Raw.Action', ({ data }) => {
        // data.name = nom de l'Action, data.arguments = arguments si tu en passes
        const actionName = data?.name || '';
        if (actionName === ACTION_NAME) {
          console.log('✅ Spin demandé via Action:', actionName);
          if (typeof window.MKRSpin === 'function') window.MKRSpin();
          return;
        }

        // Fallback compatible avec ton ancien exemple (si tu renvoies triggerName/triggerCategory dans arguments)
        const args = data?.arguments;
        if (args?.triggerName && args?.triggerCategory) {
          // Exemple: tu pourrais filtrer ici si besoin
          // if (args.triggerName === 'Reward Redemption' && args.triggerCategory === 'Twitch/Channel Reward') ...
        }
      });

      // Optionnel: exposer pour debug
      window.SBClient = client;
    } catch (err) {
      console.error('❌ Erreur connexion Streamer.bot:', err);
    }
  }

  setupStreambotClient();
})();
