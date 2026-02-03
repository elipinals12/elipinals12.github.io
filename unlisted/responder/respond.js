
function generateResponse() {
    const input = document.querySelector("#input").value;
    const output = input.toUpperCase();
    document.querySelector("#output").innerHTML = output;
  
    document.querySelector("#input").addEventListener("keydown", function removeListener() {
      document.querySelector("#input").value = "";
      document.querySelector("#input").removeEventListener("keydown", removeListener);
    });
  }
  