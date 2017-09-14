import Ajax from './ajax';

// BookList View Controller
class BookList {
  constructor() {
    this.url = '/books';
    this.books = [];
  }

  // books 객체의 마지막 id에 1을 더한 값 취득
  get lastBookId() {
    return !this.books.length ? 1 : Math.max(...this.books.map(({ id }) => id)) + 1;
  }

  // If a class method does not use this, it can safely be made a static function.
  static makeHtmlTableRow({ id, title, author, price, editable }) {
    let res = '';
    // editable의 값이 'true'인 경우, true로 변경
    const isEditable = editable || (editable === 'true');

    // [true, 'true', false, 'false'].forEach(editable => {
    //   // const isEditable = (editable === true) || (editable === 'true'); // OK
    //   const isEditable = editable || (editable === 'true'); // OK
    //   // const isEditable = (editable === 'true'); // NG
    //   // const isEditable = (editable == 'true'); // NG
    //   console.log(isEditable);
    // });

    if (isEditable) {
      res = `<tr class="row-${id}">
        <th>${id}</th>
        <td><input type="text" class="form-control" name="title" value="${title}"></td>
        <td><input type="text" class="form-control" name="author" value="${author}"></td>
        <td><input type="text" class="form-control" name="price" value="${price}"></td>
        <td>
          <div class="btn-group" role="group">
            <button type="button" class="btn btn-default" data-item="${id}" data-type="save">
              <i class="fa fa-check" aria-hidden="true"></i>
            </button>
            <button type="button" class="btn btn-default" data-item="${id}" data-type="cancel">
              <i class="fa fa-ban" aria-hidden="true"></i>
            </button>
            <button type="button" class="btn btn-default" data-item="${id}" data-type="delete">
              <i class="fa fa-trash-o" aria-hidden="true"></i>
            </button>
          </div>
        </td>
      </tr>`;
    } else {
      res = `<tr class="row-${id}">
        <th>${id}</th>
        <td>${title}</td>
        <td>${author}</td>
        <td>${(price * 1).toLocaleString()}</td>
        <td>
          <div class="btn-group" role="group">
            <button type="button" class="btn btn-default" data-item="${id}" data-type="edit">
              <i class="fa fa-pencil" aria-hidden="true"></i>
            </button>
            <button type="button" class="btn btn-default" data-item="${id}" data-type="delete">
              <i class="fa fa-trash-o" aria-hidden="true"></i>
            </button>
          </div>
        </td>
      </tr>`;
    }
    return res;
  }

  bindBooksToDom() {
    document.querySelector('tbody').innerHTML = this.books.map(({ id, title, author, price, editable }) => BookList.makeHtmlTableRow({ id, title, author, price, editable })).join('');
  }

  // bookList view 초기화
  init() {
    Ajax.get(this.url)
      .then(books => {
        this.books = JSON.parse(books);
        console.log('[GET]', this.books);
        this.bindBooksToDom();
        // bookList view event handlers
        this.bindEvent();
      });
  }

  bindEvent() {
    // Add 버튼 이벤트 핸들러
    // books 배열에 내용이 비어 있는 새로운 book 객체를 추가한다
    document.getElementById('add').addEventListener('click', () => {
      // books 객체에 새로운 book 추가
      this.books.push({
        id: this.lastBookId,
        title: '',
        author: '',
        price: '',
        status: 'new',
        editable: true
      });

      this.bindBooksToDom();
      console.log('[ADD]', this.books);
    });

    // edit / save / delete 버튼 이벤트 핸들러
    document.querySelector('tbody').addEventListener('click', e => {
      // 이벤트 타킷이 edit / save / delete 버튼이 아니면 처리 종료
      if (!e.target || e.target.nodeName !== 'BUTTON') return;

      // 이벤트를 발생시킨 버튼이 소속된 book의 id
      const targetId = e.target.dataset.item * 1;
      // 이벤트를 발생시킨 버튼의 타입 (edit / save / delete)
      const { type } = e.target.dataset;

      switch (type) {
        // edit 버튼 이벤트 핸들러
        case 'edit': {
          this.books.forEach(book => {
            if (book.id === targetId) {
              book.editable = true;
              book.status = 'edited';
            }
          });

          this.bindBooksToDom();
          console.log(`[EDIT: ${targetId}]`, this.books);
          break;
        }
        // save 버튼 이벤트 핸들러
        case 'save': {
          // save 대상 row에서 input data 취득
          const targetRowInputs = document.querySelectorAll(`.row-${targetId} input[type=text]`);
          const inputTitle = targetRowInputs[0];
          // 공백 제거
          inputTitle.value = inputTitle.value.trim();

          if (!inputTitle.value) {
            inputTitle.placeholder = '책 제목을 입력하세요.';
            inputTitle.focus();
            // return alert('책 제목을 입력하세요.');
            return;
          }

          // save 대상 row에서 사용자 입력 데이터를 취득하여 books 배열에 반영
          this.books.forEach(book => {
            if (book.id === targetId) {
              // input의 name을 key로 input의 value를 값으로 book 객체 생성
              [...targetRowInputs].forEach(input => {
                book[input.name] = input.value;
              });
              book.editable = false;

              // book 객체를 DB에 반영
              if (book.status === 'new') {
                // book status가 new(신규추가)이면 DB에 POST
                console.log(`[SAVE/NEW: ${targetId}]`, book);
                book.status = '';

                Ajax.post(this.url, book)
                  .then(res => {
                    console.log('[POST]', res);
                    return Ajax.get(this.url);
                  })
                  .then(books => {
                    this.books = JSON.parse(books);
                    console.log('[GET]', this.books);
                    this.bindBooksToDom();
                  });
              } else if (book.status === 'edited') {
                // book status가 eidt(수정)이면 DB에 PUT
                console.log(`[SAVE/EDIT: ${targetId}]`, book);
                book.status = '';

                Ajax.put(this.url, book.id, book)
                  .then(newBook => {
                    console.log('[PUT]', newBook);
                    return Ajax.get(this.url);
                  })
                  .then(books => {
                    this.books = JSON.parse(books);
                    console.log('[GET]', this.books);
                    this.bindBooksToDom();
                  });
              }
            }
          });
          break;
        }
        // cancel 버튼 이벤트 핸들러
        case 'cancel': {
          const [targetBook] = this.books.filter(book => book.id === targetId);

          if (targetBook.status === 'new') {
            // Add 버튼으로 추가된 항목(DB 미반영)에 대한 입력이 취소되면 대상 항목 삭제
            this.books = this.books.filter(book => book.id !== targetId);
          } else {
            // 기존 항목(DB 반영)에 대한 입력이 취소되면 editable 취소
            this.books.forEach(book => {
              if (book.id === targetId) {
                book.editable = false;
                book.status = '';
              }
            });
          }

          this.bindBooksToDom();
          console.log(`[CANCEL: ${targetId}]`, this.books);
          break;
        }
        // delete 버튼 이벤트 핸들러
        case 'delete': {
          Ajax.delete(this.url, targetId)
            .then(() => {
              console.log('[DEL]', targetId);
              return Ajax.get(this.url);
            })
            .then(books => {
              this.books = JSON.parse(books);
              console.log('[GET]', this.books);
              this.bindBooksToDom();
            });
          break;
        }
        default:
          break;
      }
    });
  }
}

export default new BookList();
