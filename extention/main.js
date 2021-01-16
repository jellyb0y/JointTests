if (document.querySelector('form')) {
  const socket = new WebSocket('wss://joint-tests.xyz:4433');
  const questions = {};
  const containers = Array.from(document.getElementsByClassName('freebirdFormviewerViewNumberedItemContainer'));

  const trackAction = (qID, answer) => {
    questions[qID].answer = answer;
    if (socket.readyState) {
      sendMessage({ qID, answer });
    }
  }

  const checkRadioClick = (item) => (Array.from(item.classList).includes('isChecked'));

  const updateHints = (qID) => {
    const question = questions[qID];
    const answers = question.otherAnswers;
    const target = question.target;

    let hintBody = question.hintBody;
    if (!hintBody) {
      hintBody = document.createElement('div');
      hintBody.classList.add('hintBody');
      question.hintBody = hintBody;
      target.querySelector('.freebirdFormviewerComponentsQuestionBaseRoot').appendChild(hintBody);
    }

    let isEmptyAnswers = true;
    const equalAnswers = {};
    Object.entries(answers).forEach(([userID, answer]) => {
      if (
        userID === localStorage.getItem('userID') ||
        !answer.length
      ) {
        return;
      }

      answerString = JSON.stringify(answer.sort());
      if (!equalAnswers[answerString]) {
        equalAnswers[answerString] = 1;
      } else {
        equalAnswers[answerString] += 1;
      }

      isEmptyAnswers = false;
    });

    if (isEmptyAnswers) {
      hintBody.style.display = 'none';
      return;
    }
    
    hintBody.style.display = 'block';
    hintBody.innerHTML = Object.entries(equalAnswers)
      .map(([jsonAnswer, count]) => {
        const answer = JSON.parse(jsonAnswer);
        let plural = '';

        if (answer.length > 1) {
          plural = 'ы';
        }

        answerLine = answer.map(item => {
          let text;
          if (question.type === 'text') {
            text = item
          } else {
            const label = question.controls[item];
            if (label) {
              text = label.querySelector('.exportLabel').innerText;
            }
          }
          
          return `<span>${text}</span>`;
        }).join(', ');

        return `${count} пользователей считают правильным ответ${plural}: ${answerLine}`;
      }).join('<br/>');
  };

  containers.forEach((item) => {
    const target = item.firstChild;
    const id = target.dataset.params.match(/%\.@\.\[(\d+)/)[1];
    let type;
    let controls = {};
    let answer = [];

    if (target.querySelector('.freebirdFormviewerComponentsQuestionTextRoot')) {
      type = 'text';
      const input = target.querySelector('input');
      controls['input'] = input;
      answer = [input.value];
      input.addEventListener('change', () => trackAction(id, [input.value]));
    } else if (target.querySelector('.freebirdFormviewerComponentsQuestionRadioRoot')) {
      type = 'radio';
      Array.from(target.querySelectorAll('label')).forEach((item, labelID) => {
        controls[labelID] = item;
        if (!answer && checkRadioClick(item)) {
          answer = [labelID];
        }
        item.addEventListener('click', () => setTimeout(() => {
          if (checkRadioClick(item)) {
            trackAction(id, [labelID]);
          } else {
            trackAction(id, []);
          }        
        }, 100));
      });
      target.querySelector('.appsMaterialWizButtonPaperbuttonLabel')
        .addEventListener('click', () => trackAction(id, []));
    } else if (target.querySelector('.freebirdFormviewerComponentsQuestionCheckboxRoot')) {
      type = 'checkbox';
      Array.from(target.querySelectorAll('label')).forEach((item, labelID) => {
        controls[labelID] = item;
        if (checkRadioClick(item)) {
          answer.push(labelID);
        }
        item.addEventListener('click', () => setTimeout(() => {
          let newanswer = questions[id].answer;
          if (checkRadioClick(item)) {
            if (!newanswer.includes(labelID)) {
              newanswer.push(labelID);
            }
          } else {
            newanswer = newanswer.filter(value => value && value !== labelID);
          }
          trackAction(id, newanswer);
        }, 100));
      });
    }

    questions[id] = {
      target,
      type,
      controls,
      answer
    };
  });

  const sendMessage = (object) => socket.send(JSON.stringify(object));

  socket.onopen = () => {
    const userID = localStorage.getItem('userID');
    const hrefHash = btoa(window.location.href);
    sendMessage({ hash: hrefHash, userID: userID });
  };

  socket.onmessage = ({ data: json }) => {
    const data = JSON.parse(json);
    
    if (data.userID) {
      localStorage.setItem('userID', data.userID);
    } else if (data.fullData) {
      Object.entries(data.fullData).forEach(([qID, answers]) => {
        questions[qID].otherAnswers = answers;
        updateHints(qID);
      });
    } else if (data.qID) {
      const qID = data.qID;
      if (typeof questions[qID] === 'object') {
        questions[qID].otherAnswers = data.answers;
        updateHints(qID);
      }
    }
  };
}
