  /**
   * Propagates the observable sequence or Promise that reacts first.
   * @param {Observable} rightSource Second observable sequence or Promise.
   * @returns {Observable} {Observable} An observable sequence that surfaces either of the given sequences, whichever reacted first.
   */
  observableProto.amb = function (rightSource) {
    var leftSource = this;
    return new AnonymousObservable(function (observer) {
      var choice,
        leftChoice = 'L', rightChoice = 'R',
        leftSubscription = new SingleAssignmentDisposable(),
        rightSubscription = new SingleAssignmentDisposable();

      isPromise(rightSource) && (rightSource = observableFromPromise(rightSource));

      function choiceL() {
        if (!choice) {
          choice = leftChoice;
          rightSubscription.dispose();
        }
      }

      function choiceR() {
        if (!choice) {
          choice = rightChoice;
          leftSubscription.dispose();
        }
      }

      leftSubscription.setDisposable(leftSource.subscribe(function (left) {
        choiceL();
        choice === leftChoice && observer.onNext(left);
      }, function (err) {
        choiceL();
        choice === leftChoice && observer.onError(err);
      }, function () {
        choiceL();
        choice === leftChoice && observer.onCompleted();
      }));

      rightSubscription.setDisposable(rightSource.subscribe(function (right) {
        choiceR();
        choice === rightChoice && observer.onNext(right);
      }, function (err) {
        choiceR();
        choice === rightChoice && observer.onError(err);
      }, function () {
        choiceR();
        choice === rightChoice && observer.onCompleted();
      }));

      return new CompositeDisposable(leftSubscription, rightSubscription);
    });
  };
