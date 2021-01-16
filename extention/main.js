const socket = new WebSocket('ws://localhost:8080');
const questions = {};
const containers = Array.from(document.getElementsByClassName('freebirdFormviewerViewNumberedItemContainer'));

const trackAction = (qID, answer) => {
  questions[qID].answer = answer;
  sendMessage({ qID, answer });
}

const checkRadioClick = (item) => (Array.from(item.classList).includes('isChecked'));

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
    Array.from(target.querySelectorAll('label')).forEach(item => {
      const labelID = item.getAttribute('for');
      controls[labelID] = item;
      if (!answer && checkRadioClick(item)) {
        answer = [labelID];
      }
      item.addEventListener('click', () => setTimeout(() => {
        const newAnswer = checkRadioClick(item) ? labelID : null;
        trackAction(id, [newAnswer]);
      }, 100));
    });
    target.querySelector('.appsMaterialWizButtonPaperbuttonLabel')
      .addEventListener('click', () => trackAction(id, []));
  } else if (target.querySelector('.freebirdFormviewerComponentsQuestionCheckboxRoot')) {
    type = 'checkbox';
    Array.from(target.querySelectorAll('label')).forEach(item => {
      const labelID = item.getAttribute('for');
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
          newanswer = newanswer.filter(value => value !== labelID);
        }
        trackAction(id, newanswer);
      }, 100));
    });
  }

  questions[id] = {
    block: target,
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
  } else if (data.qID) {
    questions[qID] = data.answers;
    console.log(questions);
  }
};
