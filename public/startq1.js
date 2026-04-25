import { questions } from "./q1Questions.js";

function renderQuiz() {
  const container = document.getElementById("quiz-container");
  container.innerHTML = "";

  for (let i = 0; i < questions.length; i++) {
    const q = questions[i];

    const block = document.createElement("div");
    block.className = "question-block";

    block.innerHTML = `
      <h3>${q.cat}</h3>
      <p>${q.q}</p>
      ${q.opts
        .map(
          (opt, idx) => `
          <label>
            <input type="radio" name="q${i}" value="${idx}">
            ${opt}
          </label>
        `
        )
        .join("")}
    `;

    container.appendChild(block);
  }
}

renderQuiz();
