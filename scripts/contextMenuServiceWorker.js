const getKey = () => {
  return new Promise((resolve, reject) => {
    chrome.storage.local.get(["openai-key"], (result) => {
      if (result["openai-key"]) {
        const decodedKey = atob(result["openai-key"]);
        resolve(decodedKey);
      }
    })
  })
}

const sendMessage = (content) => {
  chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
    const activeTab = tabs[0].id;

    chrome.tabs.sendMessage(
      activeTab,
      { message: 'inject', content },
      (response) => {
        if (response.status === 'failed') {
          console.log('injection failed.');
        }
      }
    );
  });
};

const generate = async (prompt) => {
  const key = await getKey();
  const url = "https://api.openai.com/v1/completions";

  const completionResponse = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${key}`
    },
    body: JSON.stringify({
      model: "text-davinci-003",
      prompt,
      max_tokens: 250,
      temperature: 0.9
    })
  });

  const completion = await completionResponse.json();
  return completion.choices.pop();
}

const generateCompletionAction = async (info) => {
  try {
    sendMessage('generating...');

    const { selectionText } = info;
    // const basePromptPrefix = `You're a thought leader with 50+ years of experience in startups and entrepreneurship. You've founded many companies, exited in successful company acquisitions and IPOs, and now you're a full-time investor. Write 5 tweets with the information below that's educational and includes anecdotes from your previous experience. Include no hashtags.
    
    // Context:`;

    const basePromptPrefix = `Write 1 tweet with the information below that's educational for your followers, largely startup founders and investors in software. Include no hashtags.
    
    Context:`;

    const baseCompletion = await generate(`${basePromptPrefix}${selectionText}`);

    sendMessage(baseCompletion.text);
  } catch(err) {
    console.log(err);
    sendMessage(err.toString());
  }
}

chrome.runtime.onInstalled.addListener(() => {
  chrome.contextMenus.create({
    id: "context-run",
    title: "Generate tweet",
    contexts: ["selection"]
  })
})

chrome.contextMenus.onClicked.addListener(generateCompletionAction);