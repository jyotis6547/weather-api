import { Component, OnInit, ViewChild, Input, ElementRef } from "@angular/core";
import { ApiService } from "src/app/service/api.service";
import { environment } from "src/environments/environment";
import { FormGroup, FormControl, Validators, FormGroupDirective } from "@angular/forms";
import { MatTableDataSource } from "@angular/material/table";
import { MatPaginator } from "@angular/material/paginator";
import { NotificationService } from "src/app/service/notification.service";
import { ConfirmationDialogComponent } from "src/app/confirmation-dialog/confirmation-dialog.component";
import { MatDialog } from "@angular/material/dialog";
import { language } from "src/environments/language";
import { Router } from '@angular/router';
import { ConsoleService } from "src/app/service/console.service";
import { MatTableModule } from "@angular/material/table";
import { DataService } from 'src/app/service/data.service';

import { of } from 'rxjs';

declare function closeModal(selector):any;
declare function openModal(selector):any;
declare function triggerClick(selector):any;
declare var moment:any;

@Component({
  selector: 'app-newsletter',
  templateUrl: './newsletter.component.html',
  styleUrls: ['./newsletter.component.scss']
})
export class NewsletterComponent implements OnInit {

 displayedColumns: string[] = [
    "email",
    "created_on",
    "status",
    "view",
    "edit",
    "delete",
  ];
  dataSource: MatTableDataSource<any>;

  country: any;
  public crudName = "Add";
  public countryList = [];
  // public depList = [];
  filterValue:any;
  isReadonly=false;
  moduleAccess:any;
  ErrorMsg:any;
  error_msg=false;
  showError=false;

  public permission={
    add:false,
    edit:false,
    view:true,
    delete:false,
  };

  // public permission={
  //   add:true,
  //   edit:true,
  //   view:true,
  //   delete:true,
  // };

  @ViewChild(MatPaginator) pagination: MatPaginator;
  @ViewChild("closebutton") closebutton;
  @ViewChild(FormGroupDirective) formGroupDirective: FormGroupDirective;

  constructor(public api: ApiService, private notification : NotificationService,
    private dialog:MatDialog, private router : Router, private elementref : ElementRef,private logger:ConsoleService,private dataService: DataService) {
    this.getNewsletter();
  }

  public editForm = new FormGroup({
    id: new FormControl(""),
    email: new FormControl(""),
    status: new FormControl("", [Validators.required]),
  });
   status = this.editForm.value.status;
  populate(data) {
    this.editForm.patchValue(data);
    // this.editForm.patchValue({trial_unit:data.trial_unit.id});
    //this.editForm.patchValue({modified_by:this.api.userid.user_id});
  }

  initForm() {
    this.editForm.patchValue({
      status: "1",
    });
  }

  Error = (controlName: string, errorName: string) => {
    return this.editForm.controls[controlName].hasError(errorName);
  };

  ngOnInit(): void {

    this.getAccess();
  }

  getNewsletter() {
    this.api
      .getAPI(environment.API_URL + "website/newsletter")
      .subscribe((res) => {
        //console.log('newsletter',res)
        this.dataSource = new MatTableDataSource(res);

        this.countryList = res;
        this.dataSource.paginator = this.pagination;
      });
  }

  create() {
    this.crudName = "Add";
    this.isReadonly=false;
    this.editForm.enable();
    let reset = this.formGroupDirective.resetForm();
    if(reset!==null) {
      this.initForm();
    }
    var element = <HTMLInputElement>document.getElementById("exampleCheck1");
    element.checked = true;
    openModal('#crud-countries');
  }

  editOption(country) {
    this.isReadonly=false;
    this.editForm.enable();
    this.crudName = "Edit";
    this.populate(country);
    var element = <HTMLInputElement> document.getElementById("exampleCheck1");
    if(this.editForm.value.status == "1") {
     element.checked = true;
    }
    else {
     element.checked = false;
    }
    openModal('#crud-countries');


  }

  onView(country) {
    this.crudName = 'View';
    this.isReadonly=true;
    this.editForm.disable();
    this.populate(country);
    var element = <HTMLInputElement> document.getElementById("exampleCheck1");
    if(this.editForm.value.status == "1") {
     element.checked = true;
    }
    else {
     element.checked = false;
    }
    openModal('#crud-countries');
  }

  onDelete(id) {
    let dialogRef = this.dialog.open(ConfirmationDialogComponent, {
      width: '350px',
      data: language[environment.DEFAULT_LANG].confirmMessage
    });
    dialogRef.afterClosed().subscribe(result => {
      if(result) {
        //'website/pages/edite/'+ this.id +'/',formData
        this.dataService.deleteRequest('website/newsletter/'+id+'/').subscribe((res:any)=>{
          //if(res.status==environment.SUCCESS_CODE) {
            this.notification.warn('Trial Type '+language[environment.DEFAULT_LANG].deleteMsg);
            this.getNewsletter();
          // } else {
          //   this.notification.displayMessage(language[environment.DEFAULT_LANG].unableDelete);
          // }
        });
      }
      dialogRef=null;
    });
  }

  onSubmit() {
    this.showError=true;
     if (this.editForm.valid) {
      //this.editForm.value.created_by = this.api.userid.user_id;
      // this.editForm.value.status = this.editForm.value.status==true ? "1" : "2";
      this.api
        .postAPI(
          environment.API_URL + "website/newsletter",

          this.editForm.value
        )
        .subscribe((res) => {
          //this.error= res.status;
          if(res.status==environment.SUCCESS_CODE){
            // this.logger.log('Formvalue',this.editForm.value);
            this.notification.success(res.message);
            this.getNewsletter();
            this.closebutton.nativeElement.click();
          } else if(res.status==environment.ERROR_CODE) {
            this.error_msg=false;
            this.ErrorMsg=res.message;
            setTimeout(()=> {
              this.error_msg = true;
           }, 2000);
          } else {
            this.notification.displayMessage(language[environment.DEFAULT_LANG].unableSubmit);
          }

        });
    }
    //closeModal('#crud-countries');
  }



  getAccess() {
    this.moduleAccess=this.api.getPageAction();
    if(this.moduleAccess)
    {
      let addPermission=(this.moduleAccess).filter(function(access){ if(access.code=='ADD') return access.status; }).map(function(obj) {return obj.status;});
      let editPermission=(this.moduleAccess).filter(function(access){ if(access.code=='EDIT') { return access.status;} }).map(function(obj) {return obj.status;});;
      let viewPermission=(this.moduleAccess).filter(function(access){ if(access.code=='VIW') { return access.status;} }).map(function(obj) {return obj.status;});;
      let deletePermission=(this.moduleAccess).filter(function(access){ if(access.code=='DEL') { return access.status;} }).map(function(obj) {return obj.status;});;
      this.permission.add=addPermission.length>0?addPermission[0]:false;
      this.permission.edit=editPermission.length>0?editPermission[0]:false;;
      this.permission.view=viewPermission.length>0?viewPermission[0]:false;;
      this.permission.delete=deletePermission.length>0?deletePermission[0]:false;;
    }

  }

  applyFilter(event: Event) {
    this.filterValue = (event.target as HTMLInputElement).value;
    if(this.filterValue){
      this.dataSource.filter = this.filterValue.trim().toLowerCase();
    } else {
      this.getNewsletter();
    }
  }
  cancelmodal(){
  closeModal('#crud-countries');
  }


}