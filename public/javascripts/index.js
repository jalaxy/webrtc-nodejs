document.querySelector('form').addEventListener('submit', (event) => {
    const formData = new FormData(event.target);
    const data = {};
    formData.forEach((value, key) => (data[key] = value));
    data['passwd'] = CryptoJS.SHA256(data['passwd']).toString(CryptoJS.enc.Hex);
    fetch('/', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
    })
        .then(res => res.json())
        .then(msg => {
            if (msg['mE'] == 'Success')
                window.location.href = `/room/${data['roomid']}`;
            else {
                document.querySelector('#msgC').innerHTML = msg['mC'];
                document.querySelector('#msgE').innerHTML = msg['mE'];
                var invalidInput;
                if (msg['mE'] == 'Room not found')
                    invalidInput = document.querySelector('#roomid');
                else if (msg['mE'] == 'Wrong password')
                    invalidInput = document.querySelector('#passwd');
                invalidInput.classList.add('invalid-input');
                invalidInput.addEventListener('input', (ev) => {
                    ev.target.classList.remove('invalid-input');
                });
            }
        })
        .catch((error) => { console.log(error); });
}, false);
