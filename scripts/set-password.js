const bcrypt = require('bcryptjs')
const fs = require('fs')
const path = require('path')
const prompt = require('password-prompt')

prompt('password: ', { method: 'hide' }).then((pw) => {
  const salt = bcrypt.genSaltSync()
  pw = bcrypt.hashSync(pw, salt)
  fs.writeFileSync(path.resolve(__dirname, '../.pw'), pw)
})
