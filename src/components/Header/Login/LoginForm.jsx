import React from "react";
import CallApi from "../../../api/api";
import classNames from "classnames";
import AppContextHOC from "../../HOC/AppContextHOC";
import { inject, observer } from "mobx-react";

@AppContextHOC
@inject(({ loginFormStore }) => ({
  loginFormStore
}))
@observer
class LoginForm extends React.Component {
  onSubmit = () => {
    this.setState({
      submitting: true
    });
    let session_id = null;
    CallApi.get("/authentication/token/new")
      .then(data => {
        return CallApi.post("/authentication/token/validate_with_login", {
          body: {
            username: this.state.username,
            password: this.state.password,
            request_token: data.request_token
          }
        });
      })
      .then(data => {
        return CallApi.post("/authentication/session/new", {
          body: {
            request_token: data.request_token
          }
        });
      })
      .then(data => {
        session_id = data.session_id;
        return CallApi.get("/account", {
          params: {
            session_id: data.session_id
          }
        });
      })
      .then(user => {
        this.setState(
          {
            submitting: false
          },
          () => {
            this.props.updateAuth({ user, session_id });
          }
        );
      })
      .catch(error => {
        this.setState({
          submitting: false,
          errors: {
            base: error.status_message
          }
        });
      });
  };

  onLogin = e => {
    e.preventDefault();
    const errors = this.validateFields();
    if (Object.keys(errors).length > 0) {
      this.setState(prevState => ({
        errors: {
          ...prevState.errors,
          ...errors
        }
      }));
    } else {
      this.onSubmit();
    }
  };

  getClassForInput = key =>
    classNames("form-control", {
      invalid: this.props.loginFormStore.errors[key]
    });

  render() {
    const {
      loginFormStore: {
        username,
        password,
        errors,
        submitting,
        onChange,
        onBlur
      }
    } = this.props;
    return (
      <div className="form-login-container">
        <form className="form-login">
          <h1 className="h3 mb-3 font-weight-normal text-center">
            Авторизация
          </h1>
          <div className="form-group">
            <label htmlFor="username">Пользователь</label>
            <input
              type="text"
              className={this.getClassForInput("username")}
              id="username"
              placeholder="Пользователь"
              name="username"
              value={username}
              onChange={onChange}
              onBlur={onBlur}
            />
            {errors.username && (
              <div className="invalid-feedback">{errors.username}</div>
            )}
          </div>
          <div className="form-group">
            <label htmlFor="password">Пароль</label>
            <input
              type="password"
              className={this.getClassForInput("password")}
              id="password"
              placeholder="Пароль"
              name="password"
              value={password}
              onChange={onChange}
              onBlur={onBlur}
            />
            {errors.password && (
              <div className="invalid-feedback">{errors.password}</div>
            )}
          </div>
          <button
            type="submit"
            className="btn btn-lg btn-primary btn-block"
            onClick={this.onLogin}
            disabled={submitting}
          >
            Вход
          </button>
          {errors.base && (
            <div className="invalid-feedback text-center">{errors.base}</div>
          )}
        </form>
      </div>
    );
  }
}

export default LoginForm;
