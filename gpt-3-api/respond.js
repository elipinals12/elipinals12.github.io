function generateResponse() {
    const input = document.querySelector("#input").value;
    const output = input.toUpperCase();
    document.querySelector("#output").innerHTML = output;
}