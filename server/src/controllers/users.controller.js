const bcrypt = require('bcryptjs');
const fs = require('fs').promises;
const User = require('../../db/models/User');

const editUser = async (req, res) => {
  const data = JSON.parse(req.body.data);
  let username = null;
  let password = null;

  if (data.username) {
    username = data.username;
  }

  let hashedPassword = null;

  if (data.password) {
    password = data.password;
    const salt = await bcrypt.genSalt(10);
    hashedPassword = await bcrypt.hash(password, salt);
  }

  const { id } = req.session.user;

  function checkData(user, pass, phot) {
    const obj = {};
    if (user && user.length > 0) {
      obj.username = user;
    }
    if (pass && pass.length > 0) {
      obj.password = hashedPassword;
    }
    if (phot) {
      obj.photo = phot;
    }
    return obj;
  }

  if (username || password || req.files) {
    let photo = null;
    if (req.files) {
      const { file } = req.files;
      const { name } = req.files.file;
      photo = `${new Date().toISOString()}-${name}`;
      file.mv(`./uploads/${photo}`);
      const candidateById = await User.findOne({ id });
      const filePath = `./uploads/${candidateById.photo}`;
      fs.unlink(filePath);
    }
    if (password && password.length < 6) {
      return res.status(400).json({ message: 'Пароль должен быть длиннее 6 символов' });
    }
    if (username && username.length < 3) {
      return res.status(400).json({ message: '"Name" должно состоять минимум из 3x символов' });
    }
    try {
      const candidate = await User.findOne({ username });
      if (candidate) {
        return res.status(400).json({ message: 'Пользователь с таким именем уже существует' });
      }
      await User.updateOne(
        {
          id,
        },
        checkData(username, password, photo),
        { new: true },
      );
      const candidateById = await User.findOne({ id });
      return res.json({ id, name: candidateById.username });
    } catch (error) {
      return res.sendStatus(500);
    }
  }
  return res.sendStatus(418);
};

const getAllUsers = async (req, res) => {
  const { id } = req.session.user;
  User.find({}, (err, users) => {
    if (err) {
      res.sendStatus(500);
    }
    const allUsersExeptId = users.filter((el) => el.id !== id);
    res.json(allUsersExeptId);
  });
};

module.exports = {
  editUser,
  getAllUsers,
};
