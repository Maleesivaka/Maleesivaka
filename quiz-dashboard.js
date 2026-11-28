/* Quiz Portal dashboard visibility: show the embedded scoreboard only while status is live. */
(function () {
  'use strict';
  var URL = 'https://pnmjrwiyyfjmztmqfiel.supabase.co';
  var KEY = 'sb_publishable_EuTJPCN9I-hoITVwidSu1w_KPdSNyFf';
  var panel = document.getElementById('quizLiveDashboard');
  var frame = document.getElementById('quizLiveFrame');
  if (!panel || !frame || !window.supabase) return;

  var client = window.supabase.createClient(URL, KEY);
  var lastStatus = null;

  async function syncQuizVisibility() {
    try {
      var result = await client.from('quiz_settings').select('status').eq('id', 1).maybeSingle();
      if (result.error) throw result.error;
      var status = result.data ? result.data.status : 'upcoming';
      var isLive = status === 'live';
      panel.hidden = !isLive;
      if (isLive && !frame.getAttribute('src')) {
        frame.src = 'quiz-live.html?embedded=dashboard';
      }
      lastStatus = status;
    } catch (error) {
      console.warn('Quiz dashboard status could not be checked:', error);
      if (lastStatus === null) panel.hidden = true;
    }
  }

  syncQuizVisibility();
  client.channel('quiz-dashboard-visibility')
    .on('postgres_changes', { event: '*', schema: 'public', table: 'quiz_settings', filter: 'id=eq.1' }, syncQuizVisibility)
    .subscribe();
  window.setInterval(syncQuizVisibility, 15000);
})();
