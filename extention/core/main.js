(function () {
  if (document.querySelector('form')) {
    const EXTENTION_VER = '1.3.1';
    const socket = new WebSocket('wss://bruh-momento.club:4444');
    const questions = {};
    const containers = Array.from(document.getElementsByClassName('freebirdFormviewerViewNumberedItemContainer'));
    const userID = localStorage.getItem('userIDHash');

    const sendMessage = (qID, data) => socket.send(JSON.stringify({ [qID]: data }));
  
    const sendAnswer = (qID, answer) => {
      questions[qID].answer = answer;
      sendMessage(qID, { answer });
    }

    const sendQuestionStatus = (qID, status) => {
      sendMessage(qID, { isActive: status });
    };

    const onProgressButtonClick = (qID) => {
      const question = questions[qID];
      if (!question || !question.target) {
        return;
      }

      const newState = !question.usersInProgress.includes(userID);

      if (newState) {
        if (!question.usersInProgress.includes(userID)) {
          question.usersInProgress.push(userID);
        }
      } else {
        question.usersInProgress = question.usersInProgress.filter(value => value && value !== userID);
      }

      updateQuestionProgress(qID);
      sendQuestionStatus(qID, newState);
    };

    const updateQuestionProgress = (qID) => {
      const question = questions[qID];
      if (!question || !question.target) {
        return;
      }

      const usersInProgress = question.usersInProgress;
      const text = question.progressText;
      const progressButton = question.progressButton;

      if (usersInProgress.includes(userID)) {
        text.innerText = 'Эту задачу решаете вы';
        progressButton.innerText = 'Завершить решение задачи';
        const countUsers = usersInProgress.length - 1;
        if (countUsers) {
          text.innerText += ` и ещё ${countUsers} пользователей`;
        }
      } else {
        progressButton.innerText = 'Решать задачу';
        const countUsers = usersInProgress.length;
        if (countUsers) {
          text.innerText = `Эту задачу решает ${countUsers} пользователей`;
        } else {
          text.innerText = '';
        }
      }
    };
  
    const checkRadioClick = (item) => (Array.from(item.classList).includes('isChecked'));
  
    const updateHints = (qID) => {
      const question = questions[qID];
      if (!question || !question.target) {
        return;
      }

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
      Object.entries(answers).forEach(([curUserID, answer]) => {
        if (userID === curUserID) {
          return;
        }

        if (!answer.length) {
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

          answerLine = answer.map(item => `<span>${item}</span>`).join(', ');
  
          return `${count} пользователей считают правильным ответ${plural}: ${answerLine}`;
        }).join('<br/>');
    };

    const updateForm = (questionsToDispatch) => {
      (questionsToDispatch || Object.keys(questions)).forEach(qID => {
        updateHints(qID);
        updateQuestionProgress(qID);
      });
    }
  
    containers.forEach((item) => {
      const target = item.firstChild;
      const params = target.dataset.params;

      if (!params) {
        return;
      }

      const id = params.match(/%\.@\.\[(\d+)/)[1];
      let type;
      let controls = {};
      let answer = [];

      const buttonWrapper = document.createElement('div');
      buttonWrapper.classList.add('buttonWrapper');
      const progressText = document.createElement('span');
      progressText.classList.add('buttonWrapperText');
      const progressButton = document.createElement('button');
      progressButton.classList.add('inProgressButton');
      progressButton.innerText = 'Решать задачу';
      buttonWrapper.appendChild(progressButton);
      buttonWrapper.appendChild(progressText);
      target.querySelector('.freebirdFormviewerComponentsQuestionBaseRoot').appendChild(buttonWrapper);
      progressButton.addEventListener('click', () => onProgressButtonClick(id));
  
      if (target.querySelector('.freebirdFormviewerComponentsQuestionTextRoot')) {
        type = 'text';
        const input = target.querySelector('input');
        controls['input'] = input;
        answer = [input.value];
        input.addEventListener('change', () => sendAnswer(id, [input.value]));
      } else if (target.querySelector('.freebirdFormviewerComponentsQuestionRadioRoot')) {
        type = 'radio';
        Array.from(target.querySelectorAll('label')).forEach((item) => {
          const textItem = item.querySelector('.exportLabel');
          let labelID;
          if (textItem) {
            labelID = textItem.innerText;
          }

          controls[labelID] = item;
          if (!answer && checkRadioClick(item)) {
            answer = [labelID];
          }

          item.addEventListener('click', () => setTimeout(() => {
            if (checkRadioClick(item)) {
              sendAnswer(id, [labelID]);
            } else {
              sendAnswer(id, []);
            }        
          }, 100));
        });
        
        const deleteAll = target.querySelector('.appsMaterialWizButtonPaperbuttonLabel');
        if (deleteAll) {
          deleteAll.addEventListener('click', () => sendAnswer(id, []));
        }
      } else if (target.querySelector('.freebirdFormviewerComponentsQuestionCheckboxRoot')) {
        type = 'checkbox';
        Array.from(target.querySelectorAll('label')).forEach((item) => {
          const textItem = item.querySelector('.exportLabel');
          let labelID;
          if (textItem) {
            labelID = textItem.innerText;
          }

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
              newanswer = newanswer.filter(value => ![null, undefined, labelID].includes(value));
            }
            sendAnswer(id, newanswer);
          }, 100));
        });
      }
  
      questions[id] = {
        target,
        type,
        controls,
        progressText,
        progressButton,
        answer,
        otherAnswers: {},
        usersInProgress: []
      };
    });
  
    socket.onopen = () => {
      const match = window.location.href.match(/\/([^/]*)\/[^/]*$/, '');
      if (match && socket.readyState) {
        socket.send(JSON.stringify({ hash: match[1], userID: userID, ver: EXTENTION_VER }));
      }
    };
  
    socket.onmessage = ({ data: json }) => {
      const incomingData = JSON.parse(json);
      
      if (incomingData.userID) {
        localStorage.setItem('userIDHash', incomingData.userID);
      } else if (incomingData.data) {
        Object.entries(incomingData.data).forEach(([qID, data]) => {
          questions[qID] = {
            ...questions[qID],
            otherAnswers: data.answers,
            usersInProgress: data.activeUsers
          };
          
          updateForm(incomingData.questionsToDispatch);
        });
      } else if (incomingData.error) {
        alert(`Произошла ошибка: ${incomingData.error}`);
      }
    };

    socket.onerror = () => alert('Не удалось подключиться к серверу :(');
  }
})();
