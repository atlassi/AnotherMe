
    const showPasswordFields = ()=>{
    $("document").ready(()=>{
    $('.passwordFields').css({'display':'block'});
    $('.detailsform').css({'display':'none'});
    })
    }


    const changePassword = () =>{
      $.ajax({
        type: "POST",
        url: '/changePassword',
        data: {
          newPassword: $('#newPassword').val(),
        },
        success: ()=> {
          alert('Password Updated');
          $('#passwordFields').css({'display':'none'});
        }
      });


        console.log(status);
    }

    const syncUpdateRequest = ()=> {
      $.get("/syncUpdateRequest", { syncUpdateRequest: true}, function( data ) {


        if (data.user.serviceProvider === null){
          $('.service').css({'display':'block'});
          $('.details1, #service, #price').css({'display':'none'});
          }
        else {
            $("#availability").prop( "checked", data.user.availability);
            $('.service').css({'display':'none'});
            $('.details1, .details2').css({'display':'block'});

            $.get("/rolesData", { roles: true}, function( data ) {
            //- console.log(JSON.stringify(data));

            for (i in data.role){
              let service = data.role[i].service;
              let price = data.role[i].price;
                //- $("#checkMark").append(`<br>${service} € ${price}`);
                $("#addedServices").append(`<br> <img src="images/checkmark.png"  width='4%'>  ${service} € ${price},- Per hour`);
                //- $("#checkMark").html(`<br> <img src="checkmark.png">`);

                //- $("#checkMark").append(html(`<img src="checkmark.png" height="42" width="42">`));

              }


            })

            }
        })
        }
      syncUpdateRequest();






    const showDetailForms = ()=>{
    $("document").ready(()=>{
    $('.detailsform').css({'display':'block'});
    $('.about').css({'display':'block'});
    $('.passwordFields').css({'display':'none'});
    //- syncUpdateRequest()

    })


    }
    const addService = () => {
    sendDetails();
    $.ajax({
      type: "POST",
      url: '/addService',
      data: {
      service: $('#service').val(),
      price: $('#price').val()
      },
      success: ()=> {
      alert('Service Added');
      }
    });
    }

    const sendDetails = () => {
      let status= $('#availability')[0].checked;
      console.log(status);
      let newDetails = {
        firstname: $('#firstname').val(),
        lastname: $('#lastname').val(),
        email: $('#email').val(),
        street: $('#street').val(),
        housenumber: $('#housenumber').val(),
        postalcode: $('#postalcode').val(),
        city: $('#city').val(),
        phone: $('#phone').val(),
        aboutme: $('#aboutme').val(),
        availability: status,
        serviceProvider: true
        //- service: service(),
        //- price: price()
      }
      updateProfile(newDetails, '/updateDetails')

    }

    const sendPassword = () => {
    let newPassword = {
      newPassword: $('#newPassword').val()
    }
    updateProfile(newPassword, '/changePassword')
    }


    const updateProfile = (data, route) =>{
      $.ajax({
        type: "POST",
        url: route,
        data: data,
        success: ()=> {
          alert('Done!');
          syncUpdateRequest();
          //- updateProfile();
          $('.detailsform').css({'display':'none'});
          //- updateProfile();
        }
      });


      console.log(status);
    }
