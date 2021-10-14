# SPEI swap

[![Build Status](https://app.travis-ci.com/trpgds/speiswp.svg?branch=master)](https://app.travis-ci.com/trpgds/speiswp)

A decentralized P2P BEP20 crypto market place

## Test me :)

- Enter to: https://trpgds.github.io
- Login with Metamask and Binance Smart Chain testnet

**Generate test receipts**
```
./run cep
```

Test receipt example:
```
||1|12102021|12102021|123456|40002|BANORTE|CRYPTO CRYPTO CRYPTO|40|000123123123123123|ABCG395813AAA|BANAMEX|JUAN,JUAN/JUAN|3|000123123123123123|ABCG395813AAA|ABC123|0.00|100.00|NA|NA|0|0|NA|0|0.00|70709567582611340615||I6utdPbMIGmgLrziJL+vVycqNIY3Q2eIJq8xo6u2d7NcFOMv7UthuHU0Z9IH9l2xQ8RnVhCJ+Q8x6Ficw5kvRxoO9yPApdaGiep+VumwtdXnOy/Th7IU/zePtZGzHEdGGrL8PyFQOkIDupMLwdeBwrId6g5nWYI03fFFwdx2VItkL/Y44TiXIBY0II96SJM4GZt0/temYf/NsfJC9al96pg53hQwNzYEMzlhWOI+8jeEl0scwtSCZEf1c6aSJnQSmuiPv23rIM0OFMgYnTYb9TKNiw2QSWxm/ylCHJyUVKbZvlxSjNg0i5YjK6iC9PW2SUWRm13kvb9/oNJi1N5/QQ==
```

**Admin tools**
```
./run admin
```

**Supported banks:**
- ✅ BBVA
- ✅ Santander
- ✅ Banamex
- ✅ Banorte
- 🕑 STP
- 🕑 HSBC
- 🕑 Scotiabank
```json
[
    {
        "Name": "Banamex",
        "Hash": "SHA256",
        "KeySize": 2048,
        "Exponent": "AQAB",
        "Modulus": "g7BDWP1KND2IMxgZVby9GRRimAiFBV2tsadk1cAL1wW8Ih1zvs/P2T35S1fHMzSEDDeglv7pp/czxZVtoxVZenF6q06nyC3F12dMsYK8P36ZakL4uUfQRlkrqn8xV8Rg/aDPOyuEbxPQCwr0QRxAkQjYyRrHDWu13ya4zC1KFnzFRJlMJ3fGlt6kgLqMV7tIuXJaA19f2DJyur6gLDLeCoPut9oso8jeQfOgjhWgJvnAUsFZZJ2uq4LqXkmYizHsQbA7UArQPc303gfTnzix9AtO8Ji6FXWSwAOeQ3p8Ia6fLBDOcz8cqx0Nrboh/XVWN+WkWKCRfCVq/qoPU0Jz1Q=="
    }, {
        "Name": "BBVA",
        "Hash": "SHA256",
        "Exponent": "AQAB",
        "KeySize": 2048,
        "Modulus": "kcnMV50N03PtzS0DFYttqjNUMc4fAeAsI0w5W546ijx3I+b6YbMmvALDZVn4T9AYeyK8fLtsD5g95z6vfnyYWSnyzsyTamm6VOEcFSfLT1KlVelzxl8PRWpves5S5i/Ve0WzC8HtdkQfBVXXYaF4f5OP50TeR1+/Z/zX9upuhbkoEbwkJdPEvxQ8nD37r83LyeH2djPglT4uOsriVM4RcFXoYPo/qJqJxeAFyUsVd5MO2wohM7VwXbSMwM4m7s2RPZZ2uE4EITSnDnka12GwIAvcIC43qBac8rrYFt9wU1qfNrOonkx0/c4EkLawwbhxXvvCR/w2nrtRUAyPIvwCkw==",
    }, {
        "Name": "Santander",
        "Hash": "SHA256",
        "KeySize": 2048,
        "Exponent": "AQAB",
        "Modulus": "rVTyHt51YxNPYICl3sx+pU1AFTlCkYZgBwuwY8IwsZksB58/RVuxqHiWJgxX7pajMkriZMpHteKRx8hYxAYbFIRVux8BqJoe/kv7LWtpZ0l1N1MuzZQIVdbt6ljWqsQfWWYQt23W54lHSU5dKYU3wohfogNhLzGmcOwPFUKbkKf6O2nKga/5n292+w6U5BrvZJ5QMJulWSnPnoP4c0KzmfheqRJ68VquKPY/kFg/X7zb7cWso5EExke3KSHiObegHmmAyT1kMduzRkti1VKLjZ77afVlFF83btD1aszPkkdbsS0L59GUZWki0wdPniRbMnqOR6Dye6e6dDyg3aF4qQ==",
    }, {
        "Name": "Banorte",
        "Hash": "SHA256",
        "KeySize": 2048,
        "Exponent": "AQAB",
        "Modulus": "l4ux/J6+dztb6RH9D6jAUpU/etY3O3cJfp9I9kJ9Ju5bvqImIzXDRb+Z3yMzdOnQSh1kkHoYc6M05YDTVq3ar2HEUxIxKGgBSUghGas7JPWN+0jICsXY0XoM7zNs8JTyIGjmhPfjM3MDwb8EXKR1GVYUsXwXD+ZgXyQ+Q/7ZJE3GkIkHxMw1RnzhoK1xWrP/k4waxnYCZzRS2GMlur123+VltBnNqpHcCggteT5mJXAlMoV3taLbMWD5dIbXWW71C6ZLl1mknA2Lu7qe01kWkzBvz+b4qq/3jVE0LBt0BGO2U6K2lJCtB1GjOmM05ICRKxT+B+g5zmGZ3P4J53rPEQ==",
    }
]
    }
```